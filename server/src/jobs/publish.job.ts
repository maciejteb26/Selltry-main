import { ListingStatus, Platform, PlatformStatus } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import * as categoryService from '../services/category.service';
import { getPlatformService } from '../services/platforms';
import { getRedis } from '../utils/redis';
import { prisma } from '../utils/prisma';

const connection = getRedis();
const QUEUE_NAME = 'publish';

interface PublishJobData {
  listingId: string;
  platform: Platform;
  userId: string;
}

export const publishQueue = new Queue<PublishJobData>(QUEUE_NAME, { connection });

let workerStarted = false;

export function startPublishWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  new Worker<PublishJobData>(
    QUEUE_NAME,
    async (job) => {
      const { listingId, platform, userId } = job.data;
      const listing = await prisma.listing.findFirst({
        where: { id: listingId, userId },
        include: { category: true, images: true },
      });
      if (!listing) throw new Error('Listing not found');

      try {
        const categoryId = await categoryService.getExternalCategoryId(listing.categoryId, platform);
        const service = getPlatformService(platform);
        const result = await service.publishListing(listing, categoryId);

        await prisma.platformListing.update({
          where: { listingId_platform: { listingId, platform } },
          data: {
            externalId: result.externalId,
            externalUrl: result.externalUrl,
            status: PlatformStatus.ACTIVE,
            publishedAt: new Date(),
            errorMessage: null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown publish error';
        await prisma.platformListing.update({
          where: { listingId_platform: { listingId, platform } },
          data: { status: PlatformStatus.ERROR, errorMessage: message, retryCount: { increment: 1 } },
        });
        throw error;
      }

      await refreshListingStatus(listingId);
    },
    { connection },
  );
}

export async function enqueuePublish(data: PublishJobData): Promise<void> {
  await publishQueue.add('publish', data, {
    attempts: 4,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 7 * 86400 },
  });
}

async function refreshListingStatus(listingId: string): Promise<void> {
  const statuses = await prisma.platformListing.findMany({
    where: { listingId },
    select: { status: true },
  });

  const allActive = statuses.length > 0 && statuses.every((s) => s.status === PlatformStatus.ACTIVE);
  const anyActive = statuses.some((s) => s.status === PlatformStatus.ACTIVE);
  const anyError = statuses.some((s) => s.status === PlatformStatus.ERROR);

  const nextStatus = allActive
    ? ListingStatus.ACTIVE
    : anyActive && anyError
      ? ListingStatus.PARTIALLY_ACTIVE
      : anyError
        ? ListingStatus.ERROR
        : ListingStatus.PUBLISHING;

  await prisma.listing.update({ where: { id: listingId }, data: { status: nextStatus } });
}

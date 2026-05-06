import { Platform } from '@prisma/client';
import { prisma } from '../utils/prisma';

const TITLE_LIMITS: Record<Platform, number> = {
  ALLEGRO: 75,
  OLX: 70,
  OTOMOTO: 80,
  OVOKO: 100,
  EBAY: 80,
};

interface ListingForTitle {
  category: { name: string };
  condition: string;
  vehicleMakeId?: string | null;
  vehicleModelId?: string | null;
  vehicleYearRaw?: number | null;
  partSide?: string | null;
  partDetails?: string | null;
}

const PLATFORM_ORDER: Platform[] = ['ALLEGRO', 'OVOKO', 'OTOMOTO', 'OLX', 'EBAY'];
const CONDITION_LABELS: Record<string, string> = {
  NEW: 'nowa',
  USED: 'uzywana',
  DAMAGED: 'uszkodzona',
};

export function getTitleLimits(): Record<Platform, number> {
  return TITLE_LIMITS;
}

export async function generateTitleForAllPlatforms(listing: ListingForTitle): Promise<Record<Platform, string>> {
  const entries = await Promise.all(
    PLATFORM_ORDER.map(async (platform) => [platform, await generateTitle(listing, platform)] as const),
  );
  return Object.fromEntries(entries) as Record<Platform, string>;
}

export async function generateTitle(listing: ListingForTitle, platform: Platform): Promise<string> {
  const [make, model] = await Promise.all([
    resolveMakeName(listing.vehicleMakeId),
    resolveModelName(listing.vehicleModelId),
  ]);

  const parts = compact([
    listing.category.name,
    make,
    model,
    listing.vehicleYearRaw?.toString(),
    listing.partSide?.toLowerCase(),
    CONDITION_LABELS[listing.condition],
    listing.partDetails,
  ]);

  const mandatory = compact([listing.category.name, make, model]);
  const limit = TITLE_LIMITS[platform];
  const fitted = fitToLimit(parts, mandatory, limit);
  return fitted || mandatory.join(' ').trim();
}

function fitToLimit(parts: string[], mandatory: string[], limit: number): string {
  const mutable = [...parts];
  while (mutable.length > mandatory.length) {
    const candidate = mutable.join(' ').trim();
    if (candidate.length <= limit) return candidate;
    mutable.pop();
  }

  const mandatoryTitle = mandatory.join(' ').trim();
  if (mandatoryTitle.length <= limit) return mandatoryTitle;
  return mandatoryTitle.slice(0, limit).trim();
}

function compact(values: Array<string | undefined | null>): string[] {
  return values.map((value) => (value ?? '').trim()).filter(Boolean);
}

async function resolveMakeName(makeId?: string | null): Promise<string | undefined> {
  if (!makeId) return undefined;
  const make = await prisma.vehicleMake.findUnique({ where: { id: makeId }, select: { name: true } });
  return make?.name;
}

async function resolveModelName(modelId?: string | null): Promise<string | undefined> {
  if (!modelId) return undefined;
  const model = await prisma.vehicleModel.findUnique({ where: { id: modelId }, select: { name: true } });
  return model?.name;
}

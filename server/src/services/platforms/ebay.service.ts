import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';

export class EbayService extends BasePlatformService {
  platform: Platform = 'EBAY';
  mockMode = env.EBAY_MOCK;

  protected async _mockPublish(_listing: ListingWithRelations): Promise<PublishResult> {
    // MOCK MODE — wymaga EBAY_MOCK=false i prawdziwego tokenu
    return mockPublish(this.platform, 'https://ebay.com/itm');
  }

  protected async _realPublish(_listing: ListingWithRelations, _categoryId: string): Promise<PublishResult> {
    throw new Error('Real eBay API not implemented yet');
  }
}

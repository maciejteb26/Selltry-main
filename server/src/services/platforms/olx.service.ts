import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';

export class OlxService extends BasePlatformService {
  platform: Platform = 'OLX';
  mockMode = env.OLX_MOCK;

  protected async _mockPublish(_listing: ListingWithRelations): Promise<PublishResult> {
    // MOCK MODE — wymaga OLX_MOCK=false i prawdziwego tokenu
    return mockPublish(this.platform, 'https://olx.pl/oferta');
  }

  protected async _realPublish(_listing: ListingWithRelations, _categoryId: string): Promise<PublishResult> {
    throw new Error('Real OLX API not implemented yet');
  }
}

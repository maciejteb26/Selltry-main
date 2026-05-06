import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';

export class OvokoService extends BasePlatformService {
  platform: Platform = 'OVOKO';
  mockMode = env.OVOKO_MOCK;

  protected async _mockPublish(_listing: ListingWithRelations): Promise<PublishResult> {
    // MOCK MODE — wymaga OVOKO_MOCK=false i prawdziwego tokenu
    return mockPublish(this.platform, 'https://ovoko.pl/oferta');
  }

  protected async _realPublish(_listing: ListingWithRelations, _categoryId: string): Promise<PublishResult> {
    throw new Error('Real Ovoko API not implemented yet');
  }
}

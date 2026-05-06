import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';

export class OtomotoService extends BasePlatformService {
  platform: Platform = 'OTOMOTO';
  mockMode = env.OTOMOTO_MOCK;

  protected async _mockPublish(_listing: ListingWithRelations): Promise<PublishResult> {
    // MOCK MODE — wymaga OTOMOTO_MOCK=false i prawdziwego tokenu
    return mockPublish(this.platform, 'https://otomoto.pl/oferta');
  }

  protected async _realPublish(_listing: ListingWithRelations, _categoryId: string): Promise<PublishResult> {
    throw new Error('Real Otomoto API not implemented yet');
  }
}

import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';

export class AllegroService extends BasePlatformService {
  platform: Platform = 'ALLEGRO';
  mockMode = env.ALLEGRO_MOCK;

  protected async _mockPublish(_listing: ListingWithRelations): Promise<PublishResult> {
    // MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu
    return mockPublish(this.platform, 'https://allegro.pl/oferta');
  }

  protected async _realPublish(_listing: ListingWithRelations, _categoryId: string): Promise<PublishResult> {
    throw new Error('Real Allegro API not implemented yet');
  }
}

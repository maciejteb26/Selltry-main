import { Platform } from '@prisma/client';
import { BasePlatformService } from './base.platform.service';
import { AllegroService } from './allegro.service';
import { OvokoService } from './ovoko.service';
import { OtomotoService } from './otomoto.service';
import { OlxService } from './olx.service';
import { EbayService } from './ebay.service';

const SERVICES: Record<Platform, BasePlatformService> = {
  ALLEGRO: new AllegroService(),
  OVOKO: new OvokoService(),
  OTOMOTO: new OtomotoService(),
  OLX: new OlxService(),
  EBAY: new EbayService(),
};

export function getPlatformService(platform: Platform): BasePlatformService {
  return SERVICES[platform];
}

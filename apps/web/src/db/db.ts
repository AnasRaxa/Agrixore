import Dexie, { type EntityTable } from 'dexie';
import type { CropChoice, Prediction, ScanState } from '@agrixore/shared';
import type { Forecast } from '../features/weather/types';
import type { PriceRow } from '../features/mandi/types';

export interface SettingRecord { key: string; value: unknown }

export interface ScanRecord {
  id: string;
  createdAt: number;
  crop: CropChoice;
  topClassId: string;
  confidence: number;
  state: ScanState;
  predictions: Prediction[];
  modelVersion: string;
  engine: 'onnx' | 'demo';
  /** Model had no field validation when this scan was made. Shown as a notice on the result. */
  experimental?: boolean;
  thumbnail: Blob;
  image: Blob;
}

export interface WeatherCacheRecord { locationKey: string; data: Forecast; fetchedAt: number }
export interface PriceCacheRecord { queryKey: string; rows: PriceRow[]; fetchedAt: number }

export interface PriceTarget {
  id: string;
  commodityId: string;
  district: string;
  target: number;
  direction: 'above' | 'below';
  active: boolean;
}

class AgrixoreDB extends Dexie {
  settings!: EntityTable<SettingRecord, 'key'>;
  scans!: EntityTable<ScanRecord, 'id'>;
  weatherCache!: EntityTable<WeatherCacheRecord, 'locationKey'>;
  priceCache!: EntityTable<PriceCacheRecord, 'queryKey'>;
  priceTargets!: EntityTable<PriceTarget, 'id'>;

  constructor() {
    super('agrixore');
    // Always bump the version and add a migration when the schema changes. Never edit an old version.
    this.version(1).stores({
      settings: 'key',
      scans: 'id, createdAt, crop',
      weatherCache: 'locationKey',
      priceCache: 'queryKey',
      priceTargets: 'id, commodityId',
    });
  }
}

export const db = new AgrixoreDB();

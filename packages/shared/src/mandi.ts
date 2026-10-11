import type { Lang2 } from './types';

/** API shapes for the mandi (market price) endpoints. Shared by apps/api and apps/web. */
export interface CommodityDto { id: string; name: Lang2; unit: string }
export interface MarketDto { id: string; name: Lang2; districtId: string }

export interface MandiPriceDto {
  commodityId: string;
  marketId: string;
  districtId: string;
  /** ISO date (YYYY-MM-DD) of the market day. null only for sample rows. */
  marketDate: string | null;
  min: number;
  modal: number;
  max: number;
  /** e.g. "PKR/40kg" */
  unit: string;
  currency: 'PKR';
  /** Where the number came from. Always shown to maintainers; never hide it. */
  source: string;
  /** true = made-up preview data. Clients MUST label it and never use it for alerts. */
  sample: boolean;
}

export interface ApiMeta { page?: number; pageSize?: number; total?: number }
export interface ApiEnvelope<T> { data: T; meta?: ApiMeta }
export interface ApiErrorBody { error: { code: string; message: string; details?: unknown } }

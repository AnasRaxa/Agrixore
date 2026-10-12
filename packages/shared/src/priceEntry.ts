import type { MandiPriceDto } from './mandi';

/** Plain types, constants and rules for admin-entered mandi prices. No dependencies, so the farmer app bundle stays small. */

/** Commodities with mandi prices. Display names live in each app's own text. */
export const COMMODITY_IDS = ['wheat', 'rice', 'maize', 'cotton', 'onion', 'potato', 'tomato'] as const;
export type CommodityId = (typeof COMMODITY_IDS)[number];

/** All mandi prices are in Pakistani rupees per 40 kg (one maund). Same string the API's sample data uses. */
export const MANDI_UNIT = 'PKR/40kg';
export const MAX_PRICE_PKR = 1_000_000;
/** Most prices one save request may carry. */
export const MAX_BATCH = 200;
export const PASSWORD_MIN_LENGTH = 12;
export const MANUAL_SOURCE = 'manual';

/** Prices typed in by an admin are recorded against one district-wide "market" per district. */
export const manualMarketId = (districtId: string): string => `${districtId}-manual`;

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30 and 10/09/2026). */
export function isRealDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export interface PriceValues { min: number; modal: number; max: number }

/** Why these three prices are not acceptable, or null when they are fine. Used by the API and by the dashboard form. */
export function validatePriceValues(p: PriceValues): string | null {
  for (const v of [p.min, p.modal, p.max]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 'Enter a number';
    if (!Number.isInteger(v)) return 'Use whole rupees';
    if (v < 1) return 'Must be at least 1';
    if (v > MAX_PRICE_PKR) return `Must be at most ${MAX_PRICE_PKR}`;
  }
  if (!(p.min <= p.modal && p.modal <= p.max)) return 'Prices must satisfy: lowest ≤ typical ≤ highest';
  return null;
}

/** One price entry: the lowest, most common (modal) and highest price seen in a district on a market day. */
export interface PriceInput extends PriceValues {
  commodityId: CommodityId;
  districtId: string;
  /** YYYY-MM-DD */
  marketDate: string;
}

/** A manually entered price as the admin dashboard sees it. */
export interface AdminPriceDto extends Omit<MandiPriceDto, 'marketDate' | 'commodityId' | 'sample' | 'source'> {
  /** Identifies the row for delete. */
  id: string;
  commodityId: CommodityId;
  marketDate: string;
  source: typeof MANUAL_SOURCE;
  sample: false;
  updatedBy: string;
  /** ISO timestamp. */
  updatedAt: string;
}

export type AdminRole = 'admin';
export interface AdminProfile { id: string; email: string; role: AdminRole }

/** What the dashboard overview shows. */
export interface PriceSummary {
  /** Today in Pakistan, YYYY-MM-DD. */
  today: string;
  totalEntries: number;
  entriesToday: number;
  lastUpdatedAt: string | null;
  /** Newest manual price per commodity, and how many districts have one from the last 7 days. */
  commodities: Array<{ commodityId: string; latestMarketDate: string | null; districtsCovered: number }>;
  districtCount: number;
}

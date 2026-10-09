import type { PriceRow } from './types';

/**
 * SAMPLE DATA FOR PREVIEWING THE SCREEN ONLY. These numbers are made up and must never be shown as real.
 * The mandi screen always labels them as sample data. Real prices need a verified source (PRODUCT.md F-MD-05).
 */
const BASE: Record<string, number> = { wheat: 4000, rice: 6000, maize: 3000, cotton: 8000, onion: 3500, potato: 2500, tomato: 3000 };
const DISTRICTS = ['lahore', 'faisalabad', 'multan', 'vehari', 'sahiwal'];

export const SAMPLE_ROWS: PriceRow[] = Object.entries(BASE).flatMap(([commodityId, modal]) =>
  DISTRICTS.map((districtId, i): PriceRow => ({
    commodityId,
    districtId,
    modal: modal + i * 100,
    min: modal + i * 100 - 200,
    max: modal + i * 100 + 200,
    marketDate: null,
    sample: true,
  })),
);

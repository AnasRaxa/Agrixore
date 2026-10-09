export interface PriceRow {
  commodityId: string;
  districtId: string;
  min: number;
  modal: number;
  max: number;
  /** ISO date of the market day. null for sample data. */
  marketDate: string | null;
  sample: boolean;
}

export const COMMODITIES = ['wheat', 'rice', 'maize', 'cotton', 'onion', 'potato', 'tomato'] as const;

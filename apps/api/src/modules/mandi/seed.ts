import type { CommodityDto, MandiPriceDto, MarketDto } from '@agrixore/shared';

export interface MandiData {
  commodities: CommodityDto[];
  markets: MarketDto[];
  prices: MandiPriceDto[];
}

/**
 * SAMPLE DATA FOR DEVELOPMENT ONLY. The numbers are made up. Every sample row carries sample: true
 * and source: "sample", and clients must label it. Real prices need a verified source (PRODUCT.md F-MD-05).
 */
const UNIT = 'PKR/40kg';

const COMMODITIES: Array<[string, string, string, number]> = [
  ['wheat', 'Wheat', 'گندم', 4000],
  ['rice', 'Rice', 'چاول', 6000],
  ['maize', 'Corn', 'مکئی', 3000],
  ['cotton', 'Cotton', 'کپاس', 8000],
  ['onion', 'Onion', 'پیاز', 3500],
  ['potato', 'Potato', 'آلو', 2500],
  ['tomato', 'Tomato', 'ٹماٹر', 3000],
];

const DISTRICTS: Array<[string, string, string]> = [
  ['lahore', 'Lahore', 'لاہور'],
  ['faisalabad', 'Faisalabad', 'فیصل آباد'],
  ['multan', 'Multan', 'ملتان'],
  ['vehari', 'Vehari', 'وہاڑی'],
  ['sahiwal', 'Sahiwal', 'ساہیوال'],
];

export const sampleData: MandiData = {
  commodities: COMMODITIES.map(([id, en, ur]) => ({ id, name: { en, ur }, unit: UNIT })),
  markets: DISTRICTS.map(([id, en, ur]) => ({
    id: `${id}-sample`,
    districtId: id,
    name: { en: `${en} (sample market)`, ur: `${ur} (نمونہ منڈی)` },
  })),
  prices: COMMODITIES.flatMap(([commodityId, , , base]) =>
    DISTRICTS.map(([districtId], i): MandiPriceDto => {
      const modal = base + i * 100;
      return {
        commodityId,
        marketId: `${districtId}-sample`,
        districtId,
        marketDate: null,
        min: modal - 200,
        modal,
        max: modal + 200,
        unit: UNIT,
        currency: 'PKR',
        source: 'sample',
        sample: true,
      };
    }),
  ),
};

export const emptyData: MandiData = { commodities: [], markets: [], prices: [] };

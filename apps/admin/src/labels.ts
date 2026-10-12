import { COMMODITY_IDS, DISTRICTS, type CommodityId } from '@agrixore/shared';

export const COMMODITY_LABEL: Record<CommodityId, string> = {
  wheat: 'Wheat', rice: 'Rice', maize: 'Maize', cotton: 'Cotton', onion: 'Onion', potato: 'Potato', tomato: 'Tomato',
};
export const commodityLabel = (id: string): string => COMMODITY_LABEL[id as CommodityId] ?? id;
export const districtLabel = (id: string): string => DISTRICTS.find((d) => d.id === id)?.name.en ?? id;
export { COMMODITY_IDS, DISTRICTS };

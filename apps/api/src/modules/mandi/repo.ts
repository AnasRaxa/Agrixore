import type { CommodityDto, MandiPriceDto, MarketDto } from '@agrixore/shared';

export interface PriceQuery {
  commodityId?: string;
  districtId?: string;
  marketId?: string;
  /** ISO dates, inclusive */
  from?: string;
  to?: string;
}

export interface MandiRepo {
  listCommodities(): Promise<CommodityDto[]>;
  listMarkets(districtId?: string): Promise<MarketDto[]>;
  /** Newest market date first. */
  findPrices(query: PriceQuery, page: { skip: number; limit: number }): Promise<{ rows: MandiPriceDto[]; total: number }>;
  /** The most recent row for each commodity + market pair. */
  latestPrices(query: Pick<PriceQuery, 'commodityId' | 'districtId' | 'marketId'>): Promise<MandiPriceDto[]>;
  /** True when the data store can answer requests (used by the readiness probe). */
  ping(): Promise<boolean>;
}

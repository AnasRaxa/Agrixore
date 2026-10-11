import type { CommodityDto, MandiPriceDto, MarketDto } from '@agrixore/shared';
import type { MandiRepo } from './repo';

export interface PricesInput {
  commodity?: string;
  district?: string;
  market?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export class MandiService {
  constructor(private readonly repo: MandiRepo) {}

  listCommodities(): Promise<CommodityDto[]> {
    return this.repo.listCommodities();
  }

  listMarkets(district?: string): Promise<MarketDto[]> {
    return this.repo.listMarkets(district);
  }

  async prices(input: PricesInput): Promise<{ rows: MandiPriceDto[]; total: number }> {
    return this.repo.findPrices(
      { commodityId: input.commodity, districtId: input.district, marketId: input.market, from: input.from, to: input.to },
      { skip: (input.page - 1) * input.pageSize, limit: input.pageSize },
    );
  }

  latest(input: { commodity?: string; district?: string; market?: string }): Promise<MandiPriceDto[]> {
    return this.repo.latestPrices({ commodityId: input.commodity, districtId: input.district, marketId: input.market });
  }
}

import type { CommodityDto, MandiPriceDto, MarketDto } from '@agrixore/shared';
import type { MandiData } from './seed';
import type { MandiRepo, PriceQuery } from './repo';

/** Used when no database is configured (local development, tests). Same behaviour as the Mongo repo. */
export class InMemoryMandiRepo implements MandiRepo {
  constructor(private readonly data: MandiData) {}

  async listCommodities(): Promise<CommodityDto[]> {
    return [...this.data.commodities].sort((a, b) => a.id.localeCompare(b.id));
  }

  async listMarkets(districtId?: string): Promise<MarketDto[]> {
    return this.data.markets.filter((m) => !districtId || m.districtId === districtId).sort((a, b) => a.id.localeCompare(b.id));
  }

  async findPrices(query: PriceQuery, page: { skip: number; limit: number }) {
    const all = this.filter(query).sort(byNewestThenKey);
    return { rows: all.slice(page.skip, page.skip + page.limit), total: all.length };
  }

  async latestPrices(query: Pick<PriceQuery, 'commodityId' | 'districtId' | 'marketId'>) {
    const latest = new Map<string, MandiPriceDto>();
    for (const row of this.filter(query).sort(byNewestThenKey)) {
      const key = `${row.commodityId}|${row.marketId}`;
      if (!latest.has(key)) latest.set(key, row); // rows are newest first, so the first one wins
    }
    return [...latest.values()].sort((a, b) => a.commodityId.localeCompare(b.commodityId) || a.marketId.localeCompare(b.marketId));
  }

  async ping() {
    return true;
  }

  private filter(q: PriceQuery): MandiPriceDto[] {
    return this.data.prices.filter((p) => {
      if (q.commodityId && p.commodityId !== q.commodityId) return false;
      if (q.districtId && p.districtId !== q.districtId) return false;
      if (q.marketId && p.marketId !== q.marketId) return false;
      if (q.from && (!p.marketDate || p.marketDate < q.from)) return false;
      if (q.to && (!p.marketDate || p.marketDate > q.to)) return false;
      return true;
    });
  }
}

function byNewestThenKey(a: MandiPriceDto, b: MandiPriceDto): number {
  const da = a.marketDate ?? '';
  const db = b.marketDate ?? '';
  if (da !== db) return da < db ? 1 : -1; // newest first; rows without a date last
  return a.commodityId.localeCompare(b.commodityId) || a.marketId.localeCompare(b.marketId);
}

import { MANDI_UNIT, MANUAL_SOURCE, manualMarketId } from '@agrixore/shared';
import type { AdminPriceDto, CommodityDto, CommodityId, MandiPriceDto, MarketDto, PriceInput } from '@agrixore/shared';
import type { AdminPriceFilter, MandiAdminRepo } from '../admin/priceRepo';
import type { MandiData } from './seed';
import type { MandiRepo, PriceQuery } from './repo';

interface ManualMeta { id: string; updatedBy: string; updatedAt: string }
const rowKey = (p: Pick<MandiPriceDto, 'commodityId' | 'marketId' | 'marketDate'>) => `${p.commodityId}|${p.marketId}|${p.marketDate}`;

/** Used when no database is configured (local development, tests). Same behaviour as the Mongo repo. */
export class InMemoryMandiRepo implements MandiRepo, MandiAdminRepo {
  private readonly data: MandiData;
  /** Who saved each manually entered row, and when. */
  private readonly manual = new Map<string, ManualMeta>();
  private seq = 0;

  constructor(data: MandiData, private readonly now: () => Date = () => new Date()) {
    // Copy, so adding prices never changes the shared sample constants.
    this.data = { ...data, prices: [...data.prices] };
  }

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

  // ---- write side: manual prices entered by an admin

  async upsertManualPrices(inputs: PriceInput[], editor: string): Promise<AdminPriceDto[]> {
    return inputs.map((input) => {
      const row: MandiPriceDto = {
        commodityId: input.commodityId, marketId: manualMarketId(input.districtId), districtId: input.districtId, marketDate: input.marketDate,
        min: input.min, modal: input.modal, max: input.max, unit: MANDI_UNIT, currency: 'PKR', source: MANUAL_SOURCE, sample: false,
      };
      const key = rowKey(row);
      const at = this.data.prices.findIndex((p) => rowKey(p) === key);
      if (at >= 0) this.data.prices[at] = row;
      else this.data.prices.push(row);
      const meta: ManualMeta = { id: this.manual.get(key)?.id ?? (++this.seq).toString(16).padStart(24, '0'), updatedBy: editor, updatedAt: this.now().toISOString() };
      this.manual.set(key, meta);
      return this.toAdmin(row, meta);
    });
  }

  async listManualPrices(filter: AdminPriceFilter, page: { skip: number; limit: number }) {
    const all = this.manualRows(filter).sort(byNewestThenKey);
    return { items: all.slice(page.skip, page.skip + page.limit).map((r) => this.toAdminRow(r)), total: all.length };
  }

  async latestManualPrices(filter: { from?: string }) {
    const latest = new Map<string, MandiPriceDto>();
    for (const row of this.manualRows({ from: filter.from }).sort(byNewestThenKey)) {
      const key = `${row.commodityId}|${row.districtId}`;
      if (!latest.has(key)) latest.set(key, row);
    }
    return [...latest.values()].map((r) => this.toAdminRow(r));
  }

  async deleteManualPrice(id: string): Promise<boolean> {
    for (const [key, meta] of this.manual) {
      if (meta.id !== id) continue;
      this.manual.delete(key);
      this.data.prices = this.data.prices.filter((p) => rowKey(p) !== key);
      return true;
    }
    return false;
  }

  async countManualPrices(filter?: { marketDate?: string }) {
    return this.manualRows({}).filter((r) => !filter?.marketDate || r.marketDate === filter.marketDate).length;
  }

  async lastManualUpdate() {
    let max: string | null = null;
    for (const m of this.manual.values()) if (!max || m.updatedAt > max) max = m.updatedAt;
    return max;
  }

  private manualRows(f: AdminPriceFilter): MandiPriceDto[] {
    return this.data.prices.filter(
      (p) =>
        p.source === MANUAL_SOURCE &&
        (!f.commodityId || p.commodityId === f.commodityId) &&
        (!f.districtId || p.districtId === f.districtId) &&
        (!f.from || (p.marketDate ?? '') >= f.from) &&
        (!f.to || (p.marketDate ?? '') <= f.to),
    );
  }

  private toAdminRow(row: MandiPriceDto): AdminPriceDto {
    return this.toAdmin(row, this.manual.get(rowKey(row)) as ManualMeta);
  }

  private toAdmin(row: MandiPriceDto, meta: ManualMeta): AdminPriceDto {
    return {
      id: meta.id, commodityId: row.commodityId as CommodityId, marketId: row.marketId, districtId: row.districtId, marketDate: row.marketDate as string,
      min: row.min, modal: row.modal, max: row.max, unit: row.unit, currency: 'PKR', source: MANUAL_SOURCE, sample: false, updatedBy: meta.updatedBy, updatedAt: meta.updatedAt,
    };
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

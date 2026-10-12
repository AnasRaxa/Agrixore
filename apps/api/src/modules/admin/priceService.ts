import { COMMODITY_IDS, DISTRICTS, addDays, todayInPakistan, type AdminPriceDto, type PriceInput, type PriceSummary } from '@agrixore/shared';
import { notFoundError, validationFailed } from './errors';
import type { AdminPriceFilter, MandiAdminRepo } from './priceRepo';

/** A district counts as "covered" for a commodity when its newest manual price is no older than this many days. */
const FRESH_DAYS = 7;

/** What the dashboard does with prices: list, save, delete and summarise. */
export class AdminPriceService {
  constructor(
    private readonly repo: MandiAdminRepo,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(filter: AdminPriceFilter, page: number, limit: number): Promise<{ items: AdminPriceDto[]; total: number }> {
    return this.repo.listManualPrices(filter, { skip: (page - 1) * limit, limit });
  }

  async save(prices: PriceInput[], editorEmail: string): Promise<AdminPriceDto[]> {
    const today = todayInPakistan(this.now());
    const future = prices.flatMap((p, i) => (p.marketDate > today ? [{ path: `prices.${i}.marketDate`, message: 'The date is in the future' }] : []));
    if (future.length) throw validationFailed(future);
    return this.repo.upsertManualPrices(prices, editorEmail);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repo.deleteManualPrice(id))) throw notFoundError('That price was not found. It may already be deleted.');
  }

  async summary(): Promise<PriceSummary> {
    const today = todayInPakistan(this.now());
    const cutoff = addDays(today, -FRESH_DAYS);
    const [latest, totalEntries, entriesToday, lastUpdatedAt] = await Promise.all([
      this.repo.latestManualPrices({}),
      this.repo.countManualPrices(),
      this.repo.countManualPrices({ marketDate: today }),
      this.repo.lastManualUpdate(),
    ]);
    return {
      today,
      totalEntries,
      entriesToday,
      lastUpdatedAt,
      districtCount: DISTRICTS.length,
      commodities: COMMODITY_IDS.map((commodityId) => {
        const rows = latest.filter((r) => r.commodityId === commodityId);
        return {
          commodityId,
          latestMarketDate: rows.reduce<string | null>((max, r) => (!max || r.marketDate > max ? r.marketDate : max), null),
          districtsCovered: rows.filter((r) => r.marketDate >= cutoff).length,
        };
      }),
    };
  }
}

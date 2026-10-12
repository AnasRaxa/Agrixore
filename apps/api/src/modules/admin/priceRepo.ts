import type { AdminPriceDto, PriceInput } from '@agrixore/shared';

export interface AdminPriceFilter {
  commodityId?: string;
  districtId?: string;
  /** ISO market dates, inclusive */
  from?: string;
  to?: string;
}

/**
 * Write side of the mandi data: prices typed in by an admin ("manual" source).
 * The same stores that serve farmers (InMemoryMandiRepo, MongoMandiRepo) implement this, so a saved price
 * shows up in GET /mandi/prices/latest immediately.
 */
export interface MandiAdminRepo {
  /** Creates or updates one price per commodity + district + market date. */
  upsertManualPrices(inputs: PriceInput[], editor: string): Promise<AdminPriceDto[]>;
  /** Newest market date first. */
  listManualPrices(filter: AdminPriceFilter, page: { skip: number; limit: number }): Promise<{ items: AdminPriceDto[]; total: number }>;
  /** The newest manual price for each commodity and district, ignoring any older than `from`. */
  latestManualPrices(filter: { from?: string }): Promise<AdminPriceDto[]>;
  deleteManualPrice(id: string): Promise<boolean>;
  countManualPrices(filter?: { marketDate?: string }): Promise<number>;
  /** ISO timestamp of the most recent manual change, or null. */
  lastManualUpdate(): Promise<string | null>;
}

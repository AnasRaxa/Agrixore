import { COMMODITY_IDS, priceInputSchema, type CommodityId, type PriceInput, type PriceRecord } from '@agrixore/shared';

/** What the person has typed for one commodity. Kept as text so a half-typed number is not lost. */
export interface RowDraft { min: string; modal: string; max: string }
export type Draft = Record<CommodityId, RowDraft>;

export const emptyRow = (): RowDraft => ({ min: '', modal: '', max: '' });
export const emptyDraft = (): Draft => Object.fromEntries(COMMODITY_IDS.map((id) => [id, emptyRow()])) as Draft;

const rowFrom = (r: PriceRecord): RowDraft => ({ min: String(r.min), modal: String(r.modal), max: String(r.max) });
export const isBlank = (r: RowDraft): boolean => !r.min.trim() && !r.modal.trim() && !r.max.trim();
// "4,000" and "4000" are the same price.
const clean = (s: string): string => s.trim().replace(/,/g, '');
export const rowsEqual = (a: RowDraft, b: RowDraft): boolean => clean(a.min) === clean(b.min) && clean(a.modal) === clean(b.modal) && clean(a.max) === clean(b.max);

/** The form for prices already saved for one district and day. */
export function draftFromRecords(records: PriceRecord[]): Draft {
  const draft = emptyDraft();
  for (const r of records) if (r.commodityId in draft) draft[r.commodityId] = rowFrom(r);
  return draft;
}

/** The newest earlier price for each commodity, to start from when today has none yet. Never includes the given date or later. */
export function draftFromPrevious(records: PriceRecord[], date: string): Draft {
  const draft = emptyDraft();
  const seen = new Set<string>();
  for (const r of [...records].sort((a, b) => b.marketDate.localeCompare(a.marketDate))) {
    if (r.marketDate >= date || seen.has(r.commodityId) || !(r.commodityId in draft)) continue;
    seen.add(r.commodityId);
    draft[r.commodityId] = rowFrom(r);
  }
  return draft;
}

/** Fills only the empty rows of `draft` from `fallback`. Rows the person already typed are never replaced. */
export function fillBlanks(draft: Draft, fallback: Draft): Draft {
  const out = { ...draft };
  for (const id of COMMODITY_IDS) if (isBlank(draft[id])) out[id] = fallback[id];
  return out;
}

const toNumber = (s: string): number => Number(clean(s));

/** Turns the form into prices to save. Empty rows are skipped; half-filled or invalid rows become errors. */
export function toBatch(draft: Draft, districtId: string, marketDate: string): { prices: PriceInput[]; errors: Partial<Record<CommodityId, string>> } {
  const prices: PriceInput[] = [];
  const errors: Partial<Record<CommodityId, string>> = {};
  for (const commodityId of COMMODITY_IDS) {
    const row = draft[commodityId];
    if (isBlank(row)) continue;
    if (!row.min.trim() || !row.modal.trim() || !row.max.trim()) {
      errors[commodityId] = 'Fill in all three prices, or leave the whole row empty.';
      continue;
    }
    const parsed = priceInputSchema.safeParse({ commodityId, districtId, marketDate, min: toNumber(row.min), modal: toNumber(row.modal), max: toNumber(row.max) });
    if (parsed.success) prices.push(parsed.data);
    else errors[commodityId] = parsed.error.issues[0]?.message ?? 'These prices are not valid.';
  }
  return { prices, errors };
}

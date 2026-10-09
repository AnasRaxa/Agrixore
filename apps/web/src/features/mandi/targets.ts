import { db, type PriceTarget } from '../../db/db';
import type { PriceRow } from './types';

export interface TargetHit { target: PriceTarget; row: PriceRow }

/** Pure: which active targets are met by real (non-sample) prices. Checked when the app opens (PRODUCT.md F-MD-04). */
export function evaluateTargets(rows: PriceRow[], targets: PriceTarget[]): TargetHit[] {
  const hits: TargetHit[] = [];
  for (const target of targets) {
    if (!target.active) continue;
    const row = rows.find((r) => !r.sample && r.commodityId === target.commodityId && r.districtId === target.district);
    if (!row) continue;
    const met = target.direction === 'above' ? row.modal >= target.target : row.modal <= target.target;
    if (met) hits.push({ target, row });
  }
  return hits;
}

export const targetRepo = {
  add: (t: Omit<PriceTarget, 'id' | 'active'>) => db.priceTargets.add({ ...t, id: crypto.randomUUID(), active: true }),
  remove: (id: string) => db.priceTargets.delete(id),
  list: () => db.priceTargets.toArray(),
};

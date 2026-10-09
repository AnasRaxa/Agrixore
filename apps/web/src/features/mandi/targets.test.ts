import { describe, expect, it } from 'vitest';
import { evaluateTargets } from './targets';
import type { PriceRow } from './types';

const row = (over: Partial<PriceRow> = {}): PriceRow => ({
  commodityId: 'wheat', districtId: 'faisalabad', min: 3900, modal: 4000, max: 4100, marketDate: '2026-07-10', sample: false, ...over,
});
const target = (over = {}) => ({ id: '1', commodityId: 'wheat', district: 'faisalabad', target: 3950, direction: 'above' as const, active: true, ...over });

describe('evaluateTargets', () => {
  it('fires when the price is above the target', () => expect(evaluateTargets([row()], [target()])).toHaveLength(1));
  it('fires when the price is below the target', () => expect(evaluateTargets([row()], [target({ direction: 'below', target: 4200 })])).toHaveLength(1));
  it('does not fire when the target is not met', () => expect(evaluateTargets([row()], [target({ target: 4500 })])).toHaveLength(0));
  it('never fires on sample data', () => expect(evaluateTargets([row({ sample: true })], [target()])).toHaveLength(0));
  it('ignores inactive targets', () => expect(evaluateTargets([row()], [target({ active: false })])).toHaveLength(0));
});

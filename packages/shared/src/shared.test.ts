import { describe, expect, it } from 'vitest';
import { convertArea, toScanState, type Prediction } from './index';

const p = (kind: Prediction['kind'], probability: number): Prediction => ({ classId: 'x', kind, probability });

describe('toScanState', () => {
  it('returns error without predictions', () => expect(toScanState(undefined)).toBe('error'));
  it('is unsure below the possible threshold', () => expect(toScanState(p('disease', 0.3))).toBe('unsure'));
  it('is possible between thresholds', () => expect(toScanState(p('disease', 0.65))).toBe('possible'));
  it('is confident at or above the confident threshold', () => expect(toScanState(p('disease', 0.8))).toBe('confident'));
  it('detects healthy leaves', () => expect(toScanState(p('healthy', 0.9))).toBe('healthy'));
  it('rejects non-leaf photos', () => expect(toScanState(p('negative', 0.9))).toBe('not_a_leaf'));
});

describe('convertArea', () => {
  it('8 kanal = 1 acre', () => expect(convertArea(8, 'kanal', 'acre')).toBeCloseTo(1, 6));
  it('20 marla = 1 kanal', () => expect(convertArea(20, 'marla', 'kanal')).toBeCloseTo(1, 6));
});

import { COMMODITY_IDS, DISTRICT_IDS, addDays, isRealDate, manualMarketId, todayInPakistan, validatePriceValues } from './index';

describe('validatePriceValues', () => {
  const ok = { min: 3800, modal: 4000, max: 4200 };
  it('accepts a valid price', () => expect(validatePriceValues(ok)).toBeNull());
  it('accepts equal values', () => expect(validatePriceValues({ min: 4000, modal: 4000, max: 4000 })).toBeNull());
  it('requires lowest <= typical <= highest', () => {
    expect(validatePriceValues({ ...ok, min: 4100 })).toMatch(/lowest/);
    expect(validatePriceValues({ ...ok, max: 3900 })).toMatch(/lowest/);
  });
  it('rejects zero, negative, fractional, huge and non-numbers', () => {
    for (const bad of [0, -5, 4000.5, 5_000_000, Number.NaN, Number.POSITIVE_INFINITY]) expect(validatePriceValues({ ...ok, modal: bad }), String(bad)).toBeTruthy();
    expect(validatePriceValues({ ...ok, modal: '4000' as unknown as number })).toBeTruthy();
  });
});

describe('isRealDate', () => {
  it('accepts real dates and rejects impossible or malformed ones', () => {
    expect(isRealDate('2026-10-09')).toBe(true);
    expect(isRealDate('2028-02-29')).toBe(true);
    for (const bad of ['10/09/2026', '2026-13-01', '2026-02-30', '2026-2-3', '']) expect(isRealDate(bad), bad).toBe(false);
  });
});

describe('shared lists and helpers', () => {
  it('has 7 commodities and unique district ids', () => {
    expect(COMMODITY_IDS).toHaveLength(7);
    expect(new Set(DISTRICT_IDS).size).toBe(DISTRICT_IDS.length);
  });
  it('names the district-wide manual market', () => expect(manualMarketId('lahore')).toBe('lahore-manual'));
  it('uses the Pakistan calendar day', () => {
    expect(todayInPakistan(new Date('2026-10-10T20:00:00Z'))).toBe('2026-10-11'); // already past midnight in Pakistan (UTC+5)
    expect(todayInPakistan(new Date('2026-10-10T18:00:00Z'))).toBe('2026-10-10');
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

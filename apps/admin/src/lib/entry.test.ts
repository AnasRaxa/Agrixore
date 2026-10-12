import { describe, expect, it } from 'vitest';
import type { PriceRecord } from '@agrixore/shared';
import { draftFromPrevious, draftFromRecords, emptyDraft, fillBlanks, rowsEqual, toBatch } from './entry';

const rec = (over: Partial<PriceRecord> = {}): PriceRecord => ({
  id: 'a'.repeat(24), commodityId: 'wheat', districtId: 'lahore', marketDate: '2026-10-11', min: 3800, modal: 4000, max: 4200,
  unit: 'PKR per 40 kg', source: 'manual', updatedBy: 'x@y.co', updatedAt: '2026-10-11T07:00:00.000Z', ...over,
});

describe('draftFromRecords', () => {
  it('shows saved values as text and leaves other commodities empty', () => {
    const d = draftFromRecords([rec()]);
    expect(d.wheat).toEqual({ min: '3800', modal: '4000', max: '4200' });
    expect(d.rice).toEqual({ min: '', modal: '', max: '' });
  });
});

describe('draftFromPrevious', () => {
  it('uses the newest earlier price per commodity, never the same day or later', () => {
    const d = draftFromPrevious(
      [rec({ marketDate: '2026-10-08', modal: 3900 }), rec({ marketDate: '2026-10-10', modal: 3950 }), rec({ marketDate: '2026-10-11', modal: 4000 }), rec({ marketDate: '2026-10-12', modal: 9999 })],
      '2026-10-11',
    );
    expect(d.wheat.modal).toBe('3950');
  });
  it('is empty when there is no earlier price', () => expect(draftFromPrevious([rec()], '2026-10-11')).toEqual(emptyDraft()));
});

describe('fillBlanks', () => {
  it('only fills empty rows and keeps what was typed', () => {
    const typed = { ...emptyDraft(), wheat: { min: '1', modal: '2', max: '3' } };
    const fallback = draftFromRecords([rec({ modal: 4000 }), rec({ commodityId: 'rice', min: 5800, modal: 6000, max: 6200 })]);
    const out = fillBlanks(typed, fallback);
    expect(out.wheat).toEqual({ min: '1', modal: '2', max: '3' });
    expect(out.rice.modal).toBe('6000');
  });
});

describe('toBatch', () => {
  it('skips empty rows and returns validated numbers', () => {
    const d = { ...emptyDraft(), wheat: { min: '3,800', modal: ' 4000 ', max: '4200' } };
    const { prices, errors } = toBatch(d, 'lahore', '2026-10-11');
    expect(errors).toEqual({});
    expect(prices).toEqual([{ commodityId: 'wheat', districtId: 'lahore', marketDate: '2026-10-11', min: 3800, modal: 4000, max: 4200 }]);
  });
  it('flags a half-filled row', () => {
    const { prices, errors } = toBatch({ ...emptyDraft(), rice: { min: '5800', modal: '', max: '' } }, 'lahore', '2026-10-11');
    expect(prices).toEqual([]);
    expect(errors.rice).toMatch(/all three/);
  });
  it('flags values in the wrong order', () => {
    const { errors } = toBatch({ ...emptyDraft(), wheat: { min: '4500', modal: '4000', max: '4200' } }, 'lahore', '2026-10-11');
    expect(errors.wheat).toMatch(/lowest/);
  });
  it('flags text, decimals and zero', () => {
    for (const bad of ['abc', '40.5', '0']) {
      const { errors } = toBatch({ ...emptyDraft(), wheat: { min: '3800', modal: bad, max: '4200' } }, 'lahore', '2026-10-11');
      expect(errors.wheat, bad).toBeTruthy();
    }
  });
  it('reports every bad row at once', () => {
    const { errors } = toBatch({ ...emptyDraft(), wheat: { min: '1', modal: '', max: '' }, rice: { min: 'x', modal: '2', max: '3' } }, 'lahore', '2026-10-11');
    expect(Object.keys(errors).sort()).toEqual(['rice', 'wheat']);
  });
});

describe('rowsEqual', () => {
  it('treats 4,000 and 4000 as the same price, and spaces as nothing', () => {
    expect(rowsEqual({ min: '3,800', modal: ' 4000', max: '4200 ' }, { min: '3800', modal: '4000', max: '4200' })).toBe(true);
  });
  it('notices a real difference', () => expect(rowsEqual({ min: '3800', modal: '4000', max: '4200' }, { min: '3800', modal: '4001', max: '4200' })).toBe(false));
});

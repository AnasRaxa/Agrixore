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

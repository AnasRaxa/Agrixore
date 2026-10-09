import { describe, expect, it } from 'vitest';
import { conditionFromCode, irrigationAdvice, weatherAlerts } from './rules';
import type { DailyForecast } from './types';

const day = (over: Partial<DailyForecast> = {}): DailyForecast => ({
  date: '2026-07-10', tMax: 30, tMin: 18, rainProb: 0, rainMm: 0, et0: null, code: 0, ...over,
});

describe('irrigationAdvice', () => {
  it('skips watering when rain is likely soon', () => expect(irrigationAdvice([day({ rainProb: 80 })])).toBe('skip'));
  it('advises early or late watering on very hot days', () => expect(irrigationAdvice([day({ tMax: 41 })])).toBe('hot'));
  it('irrigates as usual otherwise', () => expect(irrigationAdvice([day(), day()])).toBe('usual'));
  it('ignores rain later in the week', () => expect(irrigationAdvice([day(), day(), day({ rainProb: 90 })])).toBe('usual'));
});

describe('weatherAlerts', () => {
  it('finds heavy rain, frost and heatwave', () => {
    const types = weatherAlerts([day({ rainMm: 50 }), day({ tMin: 0 }), day({ tMax: 44 })]).map((a) => a.type);
    expect(types).toEqual(['heavyRain', 'frost', 'heatwave']);
  });
  it('returns nothing on a calm week', () => expect(weatherAlerts([day(), day()])).toEqual([]));
});

describe('conditionFromCode', () => {
  it('maps WMO codes', () => {
    expect(conditionFromCode(0)).toBe('clear');
    expect(conditionFromCode(63)).toBe('rain');
    expect(conditionFromCode(95)).toBe('storm');
  });
});

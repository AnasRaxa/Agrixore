import { describe, expect, it } from 'vitest';
import { conditionFromCode, irrigationAdvice, isRainingCode, upcomingDays, weatherAlerts } from './rules';
import type { DailyForecast } from './types';

const TODAY = '2026-07-10';
const TOMORROW = '2026-07-11';
const day = (over: Partial<DailyForecast> = {}): DailyForecast => ({
  date: TODAY, tMax: 30, tMin: 18, rainProb: 0, rainMm: 0, et0: null, code: 0, ...over,
});
const tomorrow = (over: Partial<DailyForecast> = {}) => day({ date: TOMORROW, ...over });
const kind = (daily: DailyForecast[], opts?: { rainingNow?: boolean }) => irrigationAdvice(daily, TODAY, opts)?.kind;

describe('irrigationAdvice', () => {
  it('skips watering when meaningful rain is forecast today', () => expect(kind([day({ rainProb: 80, rainMm: 8 })])).toBe('skipToday'));
  it('skips on a large forecast amount even with a modest chance', () => expect(kind([day({ rainProb: 40, rainMm: 12 })])).toBe('skipToday'));
  it('holds off today when meaningful rain is forecast tomorrow', () => expect(kind([day(), tomorrow({ rainProb: 85, rainMm: 14 })])).toBe('skipTomorrow'));
  it('says it is raining now when current conditions are rain', () => expect(kind([day({ rainProb: 50, rainMm: 2 })], { rainingNow: true })).toBe('rainingNow'));
  it('does not call a high chance of a trace of rain "expected"', () => expect(kind([day({ rainProb: 80, rainMm: 0.2 })])).toBe('rainPossible'));
  it('says rain is possible for a middling chance instead of "no rain expected"', () => expect(kind([day({ rainProb: 55, rainMm: 0.4 })])).toBe('rainPossible'));
  it('looks at tomorrow\'s chance too when saying rain is possible', () => expect(kind([day(), tomorrow({ rainProb: 45 })])).toBe('rainPossible'));
  it('advises early or late watering on very hot days', () => expect(kind([day({ tMax: 41 })])).toBe('hot'));
  it('rain wins over heat', () => expect(kind([day({ tMax: 41, rainProb: 90, rainMm: 10 })])).toBe('skipToday'));
  it('says plants need less water on cool days', () => expect(kind([day({ tMax: 17 })])).toBe('cool'));
  it('irrigates as usual on a calm, dry, mild day', () => expect(kind([day(), tomorrow()])).toBe('usual'));
  it('ignores rain later in the week', () => expect(kind([day(), tomorrow(), day({ date: '2026-07-12', rainProb: 90, rainMm: 20 })])).toBe('usual'));
  it('returns the forecast numbers the advice is based on', () => {
    expect(irrigationAdvice([day(), tomorrow({ tMax: 33, rainProb: 85, rainMm: 14 })], TODAY)).toEqual({ kind: 'skipTomorrow', tMax: 33, rainProb: 85, rainMm: 14 });
  });
  it('ignores past days in an old cached forecast and gives no advice', () => {
    const old = [day({ date: '2026-07-05', rainProb: 90, rainMm: 20 }), day({ date: '2026-07-06', rainProb: 90, rainMm: 20 })];
    expect(irrigationAdvice(old, TODAY)).toBeNull();
  });
  it('uses today and later days from a forecast that began yesterday', () => {
    const daily = [day({ date: '2026-07-09', rainProb: 90, rainMm: 20 }), day(), tomorrow()];
    expect(kind(daily)).toBe('usual');
  });
  it('gives no advice when the forecast is empty', () => expect(irrigationAdvice([], TODAY)).toBeNull());
});

describe('weatherAlerts', () => {
  it('finds heavy rain, frost and heatwave', () => {
    const types = weatherAlerts([day({ rainMm: 50 }), day({ tMin: 0 }), day({ tMax: 44 })], TODAY).map((a) => a.type);
    expect(types).toEqual(['heavyRain', 'frost', 'heatwave']);
  });
  it('returns nothing on a calm week', () => expect(weatherAlerts([day(), tomorrow()], TODAY)).toEqual([]));
  it('does not alert about days that are already over', () => {
    expect(weatherAlerts([day({ date: '2026-07-08', rainMm: 60, tMax: 45 }), day()], TODAY)).toEqual([]);
  });
});

describe('upcomingDays', () => {
  it('drops days before today', () => expect(upcomingDays([day({ date: '2026-07-09' }), day(), tomorrow()], TODAY).map((d) => d.date)).toEqual([TODAY, TOMORROW]));
});

describe('conditionFromCode', () => {
  it('maps WMO codes', () => {
    expect(conditionFromCode(0)).toBe('clear');
    expect(conditionFromCode(63)).toBe('rain');
    expect(conditionFromCode(95)).toBe('storm');
  });
  it('knows when it is raining', () => {
    expect(isRainingCode(61)).toBe(true);
    expect(isRainingCode(95)).toBe(true);
    expect(isRainingCode(3)).toBe(false);
    expect(isRainingCode(73)).toBe(false);
  });
});

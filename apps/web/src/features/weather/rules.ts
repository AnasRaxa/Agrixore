import { ALERT_THRESHOLDS, IRRIGATION_THRESHOLDS } from '@agrixore/shared';
import { todayInKarachi } from '../../lib/format';
import type { ConditionKey, DailyForecast, IrrigationAdvice, WeatherAlert } from './types';

const T = IRRIGATION_THRESHOLDS;

/** Rain that matters for watering: a real amount, or a likely chance together with a non-trivial amount. */
function rainMatters(d: DailyForecast): boolean {
  return d.rainMm >= T.skipRainMm || (d.rainProb >= T.skipRainProbabilityPct && d.rainMm >= T.skipRainMinMm);
}

/** Days from today onward. A cached forecast may start in the past, and old days must never drive today's advice. */
export function upcomingDays(daily: DailyForecast[], today: string): DailyForecast[] {
  return daily.filter((d) => d.date >= today);
}

/**
 * Rule-based irrigation advice (PRODUCT.md F-WX-04). Thresholds are placeholders pending agronomist review.
 * Returns null when the forecast does not cover today (for example an old cached forecast): we do not guess.
 * `rainingNow` is true when fresh current conditions say it is raining.
 */
export function irrigationAdvice(daily: DailyForecast[], today: string = todayInKarachi(), opts: { rainingNow?: boolean } = {}): IrrigationAdvice | null {
  const [d0, d1] = upcomingDays(daily, today);
  if (!d0 || d0.date !== today) return null;
  const based = (d: DailyForecast, kind: IrrigationAdvice['kind']): IrrigationAdvice => ({ kind, tMax: d.tMax, rainProb: d.rainProb, rainMm: d.rainMm });

  if (opts.rainingNow) return based(d0, 'rainingNow');
  if (rainMatters(d0)) return based(d0, 'skipToday');
  if (d1 && rainMatters(d1)) return based(d1, 'skipTomorrow');
  if (d0.tMax >= T.hotMaxC) return based(d0, 'hot');
  const maxProb = Math.max(d0.rainProb, d1?.rainProb ?? 0);
  if (maxProb >= T.maybeRainProbabilityPct) return { ...based(d0, 'rainPossible'), rainProb: maxProb };
  if (d0.tMax <= T.coolMaxC) return based(d0, 'cool');
  return based(d0, 'usual');
}

/** Heavy rain, frost and heatwave banners computed from the cached forecast (no push in Phase 1). Past days are ignored. */
export function weatherAlerts(daily: DailyForecast[], today: string = todayInKarachi()): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  for (const d of upcomingDays(daily, today)) {
    if (d.rainMm >= ALERT_THRESHOLDS.heavyRainMm) alerts.push({ type: 'heavyRain', date: d.date });
    if (d.tMin <= ALERT_THRESHOLDS.frostMinC) alerts.push({ type: 'frost', date: d.date });
    if (d.tMax >= ALERT_THRESHOLDS.heatwaveMaxC) alerts.push({ type: 'heatwave', date: d.date });
  }
  return alerts;
}

/** WMO weather interpretation codes grouped into simple conditions. */
export function conditionFromCode(code: number): ConditionKey {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

/** Is it raining (or storming) right now, according to the current-conditions code? */
export function isRainingCode(code: number): boolean {
  const c = conditionFromCode(code);
  return c === 'drizzle' || c === 'rain' || c === 'storm';
}

import { ALERT_THRESHOLDS, IRRIGATION_THRESHOLDS } from '@agrixore/shared';
import type { ConditionKey, DailyForecast, IrrigationAdvice, WeatherAlert } from './types';

/** Rule-based irrigation advice (PRODUCT.md F-WX-04). Thresholds are placeholders pending agronomist review. */
export function irrigationAdvice(daily: DailyForecast[]): IrrigationAdvice {
  const soon = daily.slice(0, 2);
  const rainLikely = soon.some((d) => d.rainProb >= IRRIGATION_THRESHOLDS.skipRainProbabilityPct || d.rainMm >= IRRIGATION_THRESHOLDS.skipRainMm);
  if (rainLikely) return 'skip';
  if (daily[0] && daily[0].tMax >= IRRIGATION_THRESHOLDS.hotMaxC) return 'hot';
  return 'usual';
}

/** Heavy rain, frost and heatwave banners computed from the cached forecast (no push in Phase 1). */
export function weatherAlerts(daily: DailyForecast[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  for (const d of daily) {
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

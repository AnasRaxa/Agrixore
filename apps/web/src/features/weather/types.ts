export interface DailyForecast {
  date: string; // YYYY-MM-DD, Asia/Karachi
  tMax: number;
  tMin: number;
  rainProb: number; // %
  rainMm: number;
  et0: number | null; // mm/day reference evapotranspiration (used in Phase 2)
  code: number; // WMO weather code
}

export interface Forecast {
  current: { temperature: number; humidity: number; wind: number; code: number };
  daily: DailyForecast[];
}

export type IrrigationKind = 'rainingNow' | 'skipToday' | 'skipTomorrow' | 'hot' | 'rainPossible' | 'cool' | 'usual';
/** The advice plus the forecast numbers it was based on, so the screen can show why. */
export interface IrrigationAdvice { kind: IrrigationKind; tMax: number; rainProb: number; rainMm: number }
export interface WeatherAlert { type: 'heavyRain' | 'frost' | 'heatwave'; date: string }
export type ConditionKey = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

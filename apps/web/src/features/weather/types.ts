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

export type IrrigationAdvice = 'skip' | 'hot' | 'usual';
export interface WeatherAlert { type: 'heavyRain' | 'frost' | 'heatwave'; date: string }
export type ConditionKey = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

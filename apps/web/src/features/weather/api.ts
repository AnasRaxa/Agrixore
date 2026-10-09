import type { Forecast } from './types';

export function weatherKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

interface OpenMeteoResponse {
  current?: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: Array<number | null>;
    et0_fao_evapotranspiration: Array<number | null>;
  };
}

/** Open-Meteo: free and key-less for non-commercial use. Verify terms before any commercial use. */
export async function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration',
    forecast_days: '7',
    timezone: 'Asia/Karachi',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const json = (await res.json()) as OpenMeteoResponse;
  const { current, daily } = json;
  if (!current || !daily) throw new Error('Unexpected weather response');
  return {
    current: { temperature: current.temperature_2m, humidity: current.relative_humidity_2m, wind: current.wind_speed_10m, code: current.weather_code },
    daily: daily.time.map((date, i) => ({
      date,
      tMax: daily.temperature_2m_max[i],
      tMin: daily.temperature_2m_min[i],
      rainProb: daily.precipitation_probability_max[i] ?? 0,
      rainMm: daily.precipitation_sum[i] ?? 0,
      et0: daily.et0_fao_evapotranspiration[i] ?? null,
      code: daily.weather_code[i],
    })),
  };
}

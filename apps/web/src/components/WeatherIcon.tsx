import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun } from 'lucide-react';
import type { ConditionKey } from '../features/weather/types';

const ICONS = { clear: Sun, partly: CloudSun, cloudy: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, snow: Snowflake, storm: CloudLightning };

export function WeatherIcon({ condition, className = 'size-6' }: { condition: ConditionKey; className?: string }) {
  const Icon = ICONS[condition];
  return <Icon aria-hidden="true" className={className} />;
}

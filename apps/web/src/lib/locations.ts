import { DISTRICTS, type District } from '@agrixore/shared';
import { i18n } from '../i18n';

export type PlaceOption = District;

export const PLACES: PlaceOption[] = [...DISTRICTS];

export function findPlace(id: string): PlaceOption | undefined {
  return PLACES.find((p) => p.id === id);
}

/** A place from the phone's GPS. Coordinates are rounded to about 1 km (privacy and cache friendliness). */
export function gpsPlace(lat: number, lon: number) {
  return {
    id: 'gps',
    name: { en: i18n.getFixedT('en')('settings.myLocation'), ur: i18n.getFixedT('ur')('settings.myLocation') },
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
    source: 'gps' as const,
  };
}

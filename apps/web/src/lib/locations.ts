import { i18n } from '../i18n';

/**
 * Starter list of places with approximate coordinates (good enough for weather at about 10 km resolution).
 * TODO(owner): replace with a verified list of Pakistani districts (open decision, ARCHITECTURE.md section 17).
 */
export interface PlaceOption {
  id: string;
  name: { en: string; ur: string };
  lat: number;
  lon: number;
}

export const PLACES: PlaceOption[] = [
  { id: 'lahore', name: { en: 'Lahore', ur: 'لاہور' }, lat: 31.55, lon: 74.34 },
  { id: 'faisalabad', name: { en: 'Faisalabad', ur: 'فیصل آباد' }, lat: 31.42, lon: 73.08 },
  { id: 'multan', name: { en: 'Multan', ur: 'ملتان' }, lat: 30.2, lon: 71.47 },
  { id: 'vehari', name: { en: 'Vehari', ur: 'وہاڑی' }, lat: 30.04, lon: 72.35 },
  { id: 'bahawalpur', name: { en: 'Bahawalpur', ur: 'بہاولپور' }, lat: 29.4, lon: 71.68 },
  { id: 'sahiwal', name: { en: 'Sahiwal', ur: 'ساہیوال' }, lat: 30.67, lon: 73.11 },
  { id: 'okara', name: { en: 'Okara', ur: 'اوکاڑہ' }, lat: 30.81, lon: 73.45 },
  { id: 'sargodha', name: { en: 'Sargodha', ur: 'سرگودھا' }, lat: 32.08, lon: 72.67 },
  { id: 'gujranwala', name: { en: 'Gujranwala', ur: 'گوجرانوالہ' }, lat: 32.16, lon: 74.19 },
  { id: 'rahim-yar-khan', name: { en: 'Rahim Yar Khan', ur: 'رحیم یار خان' }, lat: 28.42, lon: 70.3 },
  { id: 'jhang', name: { en: 'Jhang', ur: 'جھنگ' }, lat: 31.27, lon: 72.32 },
  { id: 'khanewal', name: { en: 'Khanewal', ur: 'خانیوال' }, lat: 30.3, lon: 71.93 },
  { id: 'dera-ghazi-khan', name: { en: 'Dera Ghazi Khan', ur: 'ڈیرہ غازی خان' }, lat: 30.05, lon: 70.64 },
  { id: 'islamabad', name: { en: 'Islamabad', ur: 'اسلام آباد' }, lat: 33.68, lon: 73.05 },
  { id: 'peshawar', name: { en: 'Peshawar', ur: 'پشاور' }, lat: 34.01, lon: 71.58 },
  { id: 'karachi', name: { en: 'Karachi', ur: 'کراچی' }, lat: 24.86, lon: 67.01 },
  { id: 'quetta', name: { en: 'Quetta', ur: 'کوئٹہ' }, lat: 30.18, lon: 66.99 },
];

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

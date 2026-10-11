import type { TFunction } from 'i18next';
import type { Lang } from '@agrixore/shared';
import { formatDay, todayInKarachi } from '../../lib/format';
import type { WeatherAlert } from './types';

export function dayLabel(date: string, lang: Lang, t: TFunction): string {
  return date === todayInKarachi() ? t('weather.today') : formatDay(date, lang);
}

export function describeAlert(alert: WeatherAlert, lang: Lang, t: TFunction): string {
  return t(`weather.alert.${alert.type}`, { day: dayLabel(alert.date, lang, t) });
}

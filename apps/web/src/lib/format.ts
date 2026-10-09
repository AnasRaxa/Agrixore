import type { Lang } from '@agrixore/shared';

/** Western digits are used in both languages by default (PRODUCT.md F-I18N-01). */
const LOCALES: Record<Lang, string> = { en: 'en-GB', ur: 'ur-PK-u-nu-latn' };

export function formatNumber(value: number, lang: Lang, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits }).format(value);
}

export function formatTime(timestamp: number, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }).format(timestamp);
}

export function formatDay(isoDate: string, lang: Lang, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { weekday: style }).format(new Date(`${isoDate}T12:00:00`));
}

export function formatDate(isoDate: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${isoDate}T12:00:00`));
}

export function isStale(fetchedAt: number, hours: number): boolean {
  return Date.now() - fetchedAt > hours * 3_600_000;
}

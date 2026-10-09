import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '@agrixore/shared';
import en from './locales/en.json';
import ur from './locales/ur.json';

export async function initI18n(lng: Lang) {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ur: { translation: ur } },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export { i18n };

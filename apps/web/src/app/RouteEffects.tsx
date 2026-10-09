import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TITLE_KEYS: Record<string, string> = {
  '/scan': 'nav.scan',
  '/weather': 'nav.weather',
  '/mandi': 'nav.mandi',
  '/history': 'history.title',
  '/settings': 'settings.title',
};

/** Scrolls to the top and sets the browser tab title whenever the screen changes. */
export function RouteEffects() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const key = pathname.startsWith('/result') ? 'result.title' : TITLE_KEYS[pathname];
    document.title = key ? `${t(key)} · ${t('app.name')}` : t('app.name');
  }, [pathname, t, i18n.language]);

  return null;
}

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History, Settings, WifiOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useSettings } from '../db/settings';
import { useOnline } from '../lib/online';

export function Header() {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const update = useSettings((s) => s.update);
  const online = useOnline();
  const iconButton = 'grid size-11 place-items-center rounded-full text-ink hover:bg-tint';

  return (
    <header className="safe-top sticky top-0 z-10 bg-paper/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <Link to="/" className="flex min-h-11 items-center gap-2.5 font-bold text-canopy">
          <Logo />
          <span className="text-lg">{t('app.name')}</span>
        </Link>
        <div className="flex items-center">
          {!online && (
            <span className="me-1 inline-flex items-center gap-1 rounded-full bg-grain-tint px-2.5 py-1 text-xs font-semibold text-grain">
              <WifiOff aria-hidden="true" className="size-3.5" />
              {t('common.offline')}
            </span>
          )}
          <Link to="/history" className={iconButton} aria-label={t('common.history')}><History aria-hidden="true" className="size-5" /></Link>
          <Link to="/settings" className={iconButton} aria-label={t('common.settings')}><Settings aria-hidden="true" className="size-5" /></Link>
          <button
            type="button"
            className="ms-1 min-h-11 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-canopy"
            aria-label={t('header.switchLanguage')}
            onClick={() => void update({ language: language === 'ur' ? 'en' : 'ur' })}
          >
            {language === 'ur' ? 'EN' : 'اردو'}
          </button>
        </div>
      </div>
    </header>
  );
}

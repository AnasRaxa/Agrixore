import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History, Settings, WifiOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useSettings } from '../db/settings';
import { cn } from '../lib/cn';
import { useOnline } from '../lib/online';
import { NAV_ITEMS } from './navItems';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors',
    isActive ? 'bg-tint text-canopy' : 'text-muted hover:bg-tint/60 hover:text-canopy',
  );

/** Laptop and desktop navigation (hidden below the lg breakpoint). Flips to the right in Urdu automatically. */
export function Sidebar() {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const update = useSettings((s) => s.update);
  const online = useOnline();

  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-e border-line bg-surface px-4 py-6 lg:flex">
      <Link to="/" className="flex items-center gap-3 px-2 text-xl font-bold text-canopy">
        <Logo className="size-10" />
        {t('app.name')}
      </Link>

      <nav aria-label="Main">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, key, Icon, end }) => (
            <li key={key}>
              <NavLink to={to} end={end} className={linkClass}>
                <Icon aria-hidden="true" className="size-6" />
                {t(`nav.${key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <NavLink to="/history" className={linkClass}><History aria-hidden="true" className="size-5" />{t('common.history')}</NavLink>
        <NavLink to="/settings" className={linkClass}><Settings aria-hidden="true" className="size-5" />{t('common.settings')}</NavLink>
        <button
          type="button"
          onClick={() => void update({ language: language === 'ur' ? 'en' : 'ur' })}
          aria-label={t('header.switchLanguage')}
          className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl border border-line px-3 font-semibold text-canopy transition-colors hover:bg-tint"
        >
          {language === 'ur' ? 'English' : 'اردو'}
        </button>
        {!online && (
          <p className="flex items-center justify-center gap-1.5 rounded-xl bg-grain-tint px-3 py-2 text-sm font-semibold text-grain">
            <WifiOff aria-hidden="true" className="size-4" />
            {t('common.offline')}
          </p>
        )}
      </div>
    </aside>
  );
}

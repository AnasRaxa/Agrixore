import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { NAV_ITEMS } from './navItems';

/** Phone and tablet navigation. On laptops the sidebar replaces it. */
export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-4 gap-1 px-2 py-1.5">
        {NAV_ITEMS.map(({ to, key, Icon, end }) => (
          <li key={key}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold', isActive ? 'bg-tint text-canopy' : 'text-muted')
              }
            >
              <Icon aria-hidden="true" className="size-6" />
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

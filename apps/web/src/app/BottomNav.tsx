import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CloudSun, House, ScanLine, Store } from 'lucide-react';
import { cn } from '../lib/cn';

const ITEMS = [
  { to: '/', key: 'home', Icon: House, end: true },
  { to: '/scan', key: 'scan', Icon: ScanLine, end: false },
  { to: '/weather', key: 'weather', Icon: CloudSun, end: false },
  { to: '/mandi', key: 'mandi', Icon: Store, end: false },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-line bg-surface">
      <ul className="grid grid-cols-4 gap-1 px-2 py-1.5">
        {ITEMS.map(({ to, key, Icon, end }) => (
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

import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { UpdateBanner } from './UpdateBanner';
import { RouteEffects } from './RouteEffects';

/**
 * Phone/tablet: top bar + bottom navigation, single column.
 * Laptop (lg and up): sidebar + full-width content area that uses the whole screen.
 */
export function AppShell() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <RouteEffects />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-canopy focus:px-4 focus:py-3 focus:text-white">
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <UpdateBanner />
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-2 sm:px-6 lg:px-10 lg:pb-14 lg:pt-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

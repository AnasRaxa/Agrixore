import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { UpdateBanner } from './UpdateBanner';

export function AppShell() {
  return (
    <div className="app-frame flex flex-col">
      <UpdateBanner />
      <Header />
      <main className="flex-1 px-4 pb-28 pt-2">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

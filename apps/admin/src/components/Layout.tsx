import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, LogOut, Sprout, Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { AdminProfile } from '@agrixore/shared';
import { api } from '../api';
import { ME_KEY } from '../session';
import { Button } from './ui';

const link = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-tint text-canopy' : 'text-muted hover:bg-tint/60'}`;

export function Layout({ admin, children }: { admin: AdminProfile; children: ReactNode }) {
  const qc = useQueryClient();
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="flex items-center gap-2 font-bold text-canopy">
            <span className="grid size-8 place-items-center rounded-lg bg-canopy text-white"><Sprout aria-hidden="true" className="size-5" /></span>
            Agrixore Admin
          </span>
          <nav aria-label="Main" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            <NavLink to="/" end className={link}><LayoutDashboard aria-hidden="true" className="size-4" />Dashboard</NavLink>
            <NavLink to="/prices" className={link}><Store aria-hidden="true" className="size-4" />Mandi prices</NavLink>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-sm text-muted sm:inline" title={admin.email}>{admin.email}</span>
            <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              <LogOut aria-hidden="true" className="size-4" />Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">{children}</main>
    </div>
  );
}

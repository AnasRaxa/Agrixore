import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, Database, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Card, Notice, Spinner } from '../components/ui';
import { commodityLabel } from '../labels';
import { formatDate, formatDateTime } from '../lib/format';

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 !p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint text-canopy">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="truncate text-xl font-bold text-canopy">{value}</p>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const q = useQuery({ queryKey: ['summary'], queryFn: api.summary });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-canopy">Dashboard</h1>
          <p className="text-sm text-muted">Mandi prices that farmers see in the app</p>
        </div>
        <Link to="/prices" className="rounded-xl bg-leaf px-4 py-2 font-semibold text-white hover:bg-canopy">Set today's prices</Link>
      </div>

      {q.isPending && <Spinner />}
      {q.isError && <Notice tone="error" live>Could not load the summary. Please refresh the page.</Notice>}
      {q.data && (
        <>
          {q.data.totalEntries === 0 && <Notice tone="warn">No prices have been entered yet. Add your first prices on the Mandi prices page.</Notice>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<Database aria-hidden="true" className="size-5" />} label="Prices saved" value={String(q.data.totalEntries)} />
            <Stat icon={<CalendarCheck aria-hidden="true" className="size-5" />} label={`Entered for ${formatDate(q.data.today)}`} value={String(q.data.entriesToday)} />
            <Stat icon={<Clock aria-hidden="true" className="size-5" />} label="Last change" value={q.data.lastUpdatedAt ? formatDateTime(q.data.lastUpdatedAt) : 'Never'} />
            <Stat icon={<MapPin aria-hidden="true" className="size-5" />} label="Districts available" value={String(q.data.districtCount)} />
          </div>

          <Card>
            <h2 className="text-lg font-bold text-canopy">Coverage by commodity</h2>
            <p className="mb-4 text-sm text-muted">Districts with a manually entered price from the last 7 days.</p>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[20rem] text-start text-sm">
                <caption className="sr-only">Price coverage by commodity</caption>
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th scope="col" className="py-2 pe-3 text-start font-medium">Commodity</th>
                    <th scope="col" className="py-2 pe-3 text-start font-medium">Latest market date</th>
                    <th scope="col" className="py-2 pe-3 text-start font-medium">Districts covered</th>
                    <th scope="col" className="py-2 text-start font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.commodities.map((c) => {
                    const pct = Math.round((c.districtsCovered / q.data.districtCount) * 100);
                    return (
                      <tr key={c.commodityId} className="border-b border-line/60 last:border-0">
                        <th scope="row" className="py-3 pe-3 text-start font-semibold">{commodityLabel(c.commodityId)}</th>
                        <td className="py-3 pe-3">{c.latestMarketDate ? formatDate(c.latestMarketDate) : '—'}</td>
                        <td className="py-3 pe-3">
                          <div className="flex items-center gap-2">
                            <span className="w-14 tabular-nums">{c.districtsCovered} / {q.data.districtCount}</span>
                            <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-tint sm:block" aria-hidden="true"><span className="block h-full bg-leaf" style={{ width: `${pct}%` }} /></span>
                          </div>
                        </td>
                        <td className="py-3">
                          {c.districtsCovered > 0
                            ? <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-canopy">Up to date</span>
                            : <span className="rounded-full bg-grain-tint px-2.5 py-1 text-xs font-semibold text-grain">Needs prices</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

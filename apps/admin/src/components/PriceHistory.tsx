import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminPriceDto } from '@agrixore/shared';
import { api } from '../api';
import { COMMODITY_IDS, COMMODITY_LABEL, DISTRICTS, commodityLabel, districtLabel } from '../labels';
import { formatDate, formatDateTime, formatPkr } from '../lib/format';
import { Button, Card, Notice, Spinner, inputClass } from './ui';

const PAGE_SIZE = 25;

export function PriceHistory({ onEdit }: { onEdit: (r: AdminPriceDto) => void }) {
  const qc = useQueryClient();
  const [commodity, setCommodity] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);

  const list = useQuery({
    queryKey: ['prices', 'history', commodity, district, page],
    queryFn: () => api.prices({ commodity, district, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const del = useMutation({
    mutationFn: (r: AdminPriceDto) => api.deletePrice(r.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prices'] });
      void qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const confirmDelete = (r: AdminPriceDto) => {
    if (window.confirm(`Delete the ${commodityLabel(r.commodityId)} price for ${districtLabel(r.districtId)} on ${formatDate(r.marketDate)}?\n\nFarmers will stop seeing it.`)) del.mutate(r);
  };

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <h2 className="text-lg font-bold text-canopy">Price history</h2>
      <p className="mb-4 text-sm text-muted">Every price you have saved, newest first.</p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="f-commodity" className="mb-1 block text-sm font-medium">Commodity</label>
          <select id="f-commodity" value={commodity} onChange={(e) => { setCommodity(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All commodities</option>
            {COMMODITY_IDS.map((id) => <option key={id} value={id}>{COMMODITY_LABEL[id]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-district" className="mb-1 block text-sm font-medium">District</label>
          <select id="f-district" value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">All districts</option>
            {DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name.en}</option>)}
          </select>
        </div>
      </div>

      {list.isPending && <Spinner />}
      {list.isError && <Notice tone="error" live>Could not load the history. Please try again.</Notice>}
      {del.isError && <Notice tone="error" live>That price could not be deleted. It may already be gone; the list has been refreshed.</Notice>}
      {list.data && list.data.items.length === 0 && <p className="py-6 text-center text-muted">No prices found.</p>}
      {list.data && list.data.items.length > 0 && (
        <>
          <ul className="space-y-3 sm:hidden">
            {list.data.items.map((r) => (
              <li key={r.id} className="rounded-xl border border-line p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{commodityLabel(r.commodityId)} <span className="font-normal text-muted">· {districtLabel(r.districtId)}</span></span>
                  <span className="text-sm text-muted">{formatDate(r.marketDate)}</span>
                </div>
                <dl className="my-2 grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-xs text-muted">Lowest</dt><dd className="tabular-nums">{formatPkr(r.min)}</dd></div>
                  <div><dt className="text-xs text-muted">Typical</dt><dd className="font-semibold tabular-nums">{formatPkr(r.modal)}</dd></div>
                  <div><dt className="text-xs text-muted">Highest</dt><dd className="tabular-nums">{formatPkr(r.max)}</dd></div>
                </dl>
                <p className="truncate text-xs text-muted" title={r.updatedBy}>{r.updatedBy} · {formatDateTime(r.updatedAt)}</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" className="flex-1 py-1.5" onClick={() => onEdit(r)} aria-label={`Edit ${commodityLabel(r.commodityId)} in ${districtLabel(r.districtId)} on ${formatDate(r.marketDate)}`}><Pencil aria-hidden="true" className="size-4" />Edit</Button>
                  <Button variant="danger" className="flex-1 py-1.5" onClick={() => confirmDelete(r)} disabled={del.isPending} aria-label={`Delete ${commodityLabel(r.commodityId)} in ${districtLabel(r.districtId)} on ${formatDate(r.marketDate)}`}><Trash2 aria-hidden="true" className="size-4" />Delete</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="relative hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Saved prices, in PKR per 40 kg</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  {['Date', 'Commodity', 'District', 'Lowest', 'Typical', 'Highest', 'Saved by'].map((h) => <th key={h} scope="col" className="py-2 pe-3 text-start font-medium">{h}</th>)}
                  <th scope="col" className="py-2 text-end font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((r) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pe-3 whitespace-nowrap">{formatDate(r.marketDate)}</td>
                    <td className="py-2 pe-3 font-semibold">{commodityLabel(r.commodityId)}</td>
                    <td className="py-2 pe-3">{districtLabel(r.districtId)}</td>
                    <td className="py-2 pe-3 tabular-nums">{formatPkr(r.min)}</td>
                    <td className="py-2 pe-3 font-semibold tabular-nums">{formatPkr(r.modal)}</td>
                    <td className="py-2 pe-3 tabular-nums">{formatPkr(r.max)}</td>
                    <td className="py-2 pe-3 text-xs text-muted"><span className="block max-w-40 truncate" title={r.updatedBy}>{r.updatedBy}</span>{formatDateTime(r.updatedAt)}</td>
                    <td className="py-2 text-end whitespace-nowrap">
                      <Button variant="ghost" className="px-2 py-1" onClick={() => onEdit(r)} aria-label={`Edit ${commodityLabel(r.commodityId)} in ${districtLabel(r.districtId)} on ${formatDate(r.marketDate)}`}><Pencil aria-hidden="true" className="size-4" />Edit</Button>
                      <Button variant="danger" className="ms-1 px-2 py-1" onClick={() => confirmDelete(r)} disabled={del.isPending} aria-label={`Delete ${commodityLabel(r.commodityId)} in ${districtLabel(r.districtId)} on ${formatDate(r.marketDate)}`}><Trash2 aria-hidden="true" className="size-4" />Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <span className="flex items-center gap-2">
              <Button variant="secondary" className="px-3 py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span>Page {page} of {pages}</span>
              <Button variant="secondary" className="px-3 py-1.5" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import { db } from '../../db/db';
import { useOnline } from '../../lib/online';
import { SAMPLE_ROWS } from './sample';
import type { PriceRow } from './types';

/** TODO(owner): align with the real API response once apps/api exists (ARCHITECTURE.md section 8.4). */
interface ApiPriceRow { commodityId: string; district: string; min: number; modal: number; max: number; marketDate: string }

/** Offline-first. Without a backend (no VITE_API_BASE_URL) the screen shows clearly labelled sample data. */
export function usePrices() {
  const online = useOnline();
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const cached = useLiveQuery(async () => ({ record: await db.priceCache.get('all') }), []);

  const query = useQuery({
    queryKey: ['mandi', 'all'],
    enabled: online && !!apiBase,
    staleTime: 30 * 60_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      const res = await fetch(`${apiBase}/api/v1/mandi/prices`, { signal });
      if (!res.ok) throw new Error(`Price request failed (${res.status})`);
      const json = (await res.json()) as { data: ApiPriceRow[] };
      const rows: PriceRow[] = json.data.map((r) => ({
        commodityId: r.commodityId, districtId: r.district, min: r.min, modal: r.modal, max: r.max, marketDate: r.marketDate, sample: false,
      }));
      await db.priceCache.put({ queryKey: 'all', rows, fetchedAt: Date.now() });
      return true;
    },
  });

  const record = cached?.record;
  return {
    rows: record?.rows ?? SAMPLE_ROWS,
    fetchedAt: record?.fetchedAt ?? null,
    isSample: !record,
    online,
    isError: query.isError,
  };
}

import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import type { ApiEnvelope, MandiPriceDto } from '@agrixore/shared';
import { db } from '../../db/db';
import { useOnline } from '../../lib/online';
import { SAMPLE_ROWS } from './sample';
import type { PriceRow } from './types';

/**
 * Offline-first. Without a backend (no VITE_API_BASE_URL) the screen shows clearly labelled sample data.
 * With a backend, the API flags its own preview rows (sample: true) and the screen labels those too.
 */
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
      const res = await fetch(`${apiBase}/api/v1/mandi/prices/latest`, { signal });
      if (!res.ok) throw new Error(`Price request failed (${res.status})`);
      const json = (await res.json()) as ApiEnvelope<MandiPriceDto[]>;
      const rows: PriceRow[] = json.data.map((r) => ({
        commodityId: r.commodityId, districtId: r.districtId, min: r.min, modal: r.modal, max: r.max, marketDate: r.marketDate, sample: r.sample,
      }));
      await db.priceCache.put({ queryKey: 'all', rows, fetchedAt: Date.now() });
      return true;
    },
  });

  const record = cached?.record;
  const rows = record?.rows ?? SAMPLE_ROWS;
  return {
    rows,
    fetchedAt: record?.fetchedAt ?? null,
    isSample: rows.some((r) => r.sample),
    online,
    isError: query.isError,
  };
}

import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import { db } from '../../db/db';
import { useSettings } from '../../db/settings';
import { useOnline } from '../../lib/online';
import { fetchForecast, weatherKey } from './api';

/** Offline-first: render what is in IndexedDB, refresh in the background when online. */
export function useForecast() {
  const place = useSettings((s) => s.place);
  const online = useOnline();
  const key = place ? weatherKey(place.lat, place.lon) : null;
  const cached = useLiveQuery(async () => ({ record: key ? await db.weatherCache.get(key) : undefined }), [key]);

  const query = useQuery({
    queryKey: ['weather', key],
    enabled: !!place && online,
    staleTime: 30 * 60_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      if (!place || !key) return false;
      const data = await fetchForecast(place.lat, place.lon, signal);
      await db.weatherCache.put({ locationKey: key, data, fetchedAt: Date.now() });
      return true;
    },
  });

  return {
    place,
    online,
    loading: cached === undefined,
    record: cached?.record,
    isFetching: query.isFetching,
    isError: query.isError,
    refresh: () => void query.refetch(),
  };
}

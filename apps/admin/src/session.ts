import { useQuery } from '@tanstack/react-query';
import { ApiError, api } from './api';

export const ME_KEY = ['me'] as const;

/** The signed-in admin, or null when signed out. */
export function useSession() {
  return useQuery({
    queryKey: ME_KEY,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        return await api.me();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
  });
}

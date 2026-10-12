import type { AdminPriceDto, AdminProfile, PriceInput, PriceSummary } from '@agrixore/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
  }
}

interface Envelope<T, M> { data: T; meta: M }
interface Meta { page?: number; pageSize?: number; total?: number }

async function call<T, M = undefined>(method: string, path: string, body?: unknown): Promise<Envelope<T, M>> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your internet connection and try again.');
  }
  const json = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string; details?: ApiError['details'] } } | null;
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? 'Something went wrong. Please try again.', json?.error?.details);
  return json as unknown as Envelope<T, M>;
}

export interface PriceQuery { commodity?: string; district?: string; from?: string; to?: string; page?: number; limit?: number }
const qs = (q: PriceQuery) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  me: () => call<AdminProfile>('GET', '/admin/auth/me').then((r) => r.data),
  login: (email: string, password: string) => call<AdminProfile>('POST', '/admin/auth/login', { email, password }).then((r) => r.data),
  logout: () => call<{ ok: true }>('POST', '/admin/auth/logout').then(() => undefined),
  summary: () => call<PriceSummary>('GET', '/admin/summary').then((r) => r.data),
  prices: (q: PriceQuery) => call<AdminPriceDto[], Meta>('GET', `/admin/prices${qs(q)}`).then((r) => ({ items: r.data, total: r.meta.total ?? r.data.length })),
  savePrices: (batch: { prices: PriceInput[] }) => call<AdminPriceDto[]>('PUT', '/admin/prices', batch).then((r) => r.data),
  deletePrice: (id: string) => call<{ ok: true }>('DELETE', `/admin/prices/${id}`).then(() => undefined),
};

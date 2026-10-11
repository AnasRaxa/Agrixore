import { z } from 'zod';

const id = z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/, 'must be lowercase letters, numbers or dashes');
const isoDate = z.iso.date();

export const marketsQuery = z.object({ district: id.optional() });

export const latestQuery = z.object({
  commodity: id.optional(),
  district: id.optional(),
  market: id.optional(),
});

export const pricesQuery = z
  .object({
    commodity: id.optional(),
    district: id.optional(),
    market: id.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(100),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from must be on or before to', path: ['from'] });

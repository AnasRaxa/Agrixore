import { z } from 'zod';
import { COMMODITY_IDS, DISTRICT_IDS, MAX_BATCH, isRealDate, validatePriceValues } from '@agrixore/shared';

/** An empty form field (?commodity=) means "no filter". */
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const marketDate = z.string().refine(isRealDate, 'Use a real date in the format YYYY-MM-DD');

export const priceInputSchema = z
  .object({
    commodityId: z.enum(COMMODITY_IDS),
    districtId: z.enum(DISTRICT_IDS),
    marketDate,
    min: z.number('Enter a number'),
    modal: z.number('Enter a number'),
    max: z.number('Enter a number'),
  })
  .superRefine((p, ctx) => {
    // Each number on its own first (so the message points at the right field), then the order of the three.
    let fieldProblem = false;
    for (const field of ['min', 'modal', 'max'] as const) {
      const msg = validatePriceValues({ min: p[field], modal: p[field], max: p[field] });
      if (msg) {
        fieldProblem = true;
        ctx.addIssue({ code: 'custom', path: [field], message: msg });
      }
    }
    const order = fieldProblem ? null : validatePriceValues(p);
    if (order) ctx.addIssue({ code: 'custom', path: ['modal'], message: order });
  });

export const priceBatchSchema = z
  .object({ prices: z.array(priceInputSchema).min(1, 'Add at least one price').max(MAX_BATCH) })
  .refine((b) => new Set(b.prices.map((p) => `${p.commodityId}|${p.districtId}|${p.marketDate}`)).size === b.prices.length, {
    message: 'The same commodity, district and date appears twice',
    path: ['prices'],
  });

export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export const adminPricesQuery = z.object({
  commodity: optional(z.enum(COMMODITY_IDS)),
  district: optional(z.enum(DISTRICT_IDS)),
  from: optional(marketDate),
  to: optional(marketDate),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const idParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id') });

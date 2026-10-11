import { Router } from 'express';
import { ok } from '../../lib/http';
import { latestQuery, marketsQuery, pricesQuery } from './schema';
import type { MandiService } from './service';

/** Controller + routes for /api/v1/mandi. Parses input with zod, calls the service, wraps the result. */
export function mandiRouter(service: MandiService): Router {
  const router = Router();
  // Prices change at most daily, so a short shared cache is safe and saves farmers' mobile data.
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    next();
  });

  router.get('/commodities', async (_req, res) => {
    ok(res, await service.listCommodities());
  });

  router.get('/markets', async (req, res) => {
    const q = marketsQuery.parse(req.query);
    ok(res, await service.listMarkets(q.district));
  });

  router.get('/prices/latest', async (req, res) => {
    const q = latestQuery.parse(req.query);
    ok(res, await service.latest(q));
  });

  router.get('/prices', async (req, res) => {
    const q = pricesQuery.parse(req.query);
    const { rows, total } = await service.prices(q);
    ok(res, rows, { page: q.page, pageSize: q.pageSize, total });
  });

  return router;
}

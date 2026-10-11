import { Router } from 'express';
import { ok } from '../../lib/http';
import type { MandiRepo } from '../mandi/repo';

export function healthRouter(deps: { repo: MandiRepo }): Router {
  const router = Router();

  /** Liveness: the process is up. */
  router.get('/', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    ok(res, { status: 'ok', service: 'agrixore-api', uptimeSeconds: Math.round(process.uptime()), time: new Date().toISOString() });
  });

  /** Readiness: the data store can answer. Hosting platforms use this to decide when to send traffic. */
  router.get('/ready', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const ready = await deps.repo.ping().catch(() => false);
    if (ready) {
      ok(res, { status: 'ready' });
      return;
    }
    res.status(503).json({ error: { code: 'NOT_READY', message: 'Data store is not available' } });
  });

  return router;
}

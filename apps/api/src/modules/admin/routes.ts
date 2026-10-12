import { Router, type CookieOptions, type RequestHandler } from 'express';
import type { Config } from '../../config/env';
import { AppError } from '../../lib/errors';
import { ok } from '../../lib/http';
import { SESSION_COOKIE, SESSION_COOKIE_PATH, currentAdmin, noStore, requireAdmin, sameSiteGuard } from '../../middleware/admin';
import type { AdminPriceService } from './priceService';
import type { AuthService } from './authService';
import { adminPricesQuery, idParams, loginSchema, priceBatchSchema } from './schema';

interface Deps { config: Config; auth: AuthService; prices: AdminPriceService; loginLimiter: RequestHandler }

/** /api/v1/admin: sign-in and price management for the dashboard. Input is parsed with zod; failures reach the shared error handler. */
export function adminRouter({ config, auth, prices, loginLimiter }: Deps): Router {
  const router = Router();
  router.use(noStore, sameSiteGuard);

  const cookie: CookieOptions = { httpOnly: true, secure: config.cookieSecure, sameSite: 'strict', path: SESSION_COOKIE_PATH };

  router.post('/auth/login', loginLimiter, async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await auth.login(email, password);
    // The same message for a wrong email and a wrong password, so nobody can find out which emails exist.
    if (!result) throw new AppError(401, 'INVALID_CREDENTIALS', 'The email or password is not correct.');
    res.cookie(SESSION_COOKIE, result.token, { ...cookie, maxAge: config.adminSessionHours * 3_600_000 });
    ok(res, result.admin);
  });

  router.post('/auth/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookie);
    ok(res, { ok: true });
  });

  const guard = requireAdmin(auth);

  router.get('/auth/me', guard, (_req, res) => {
    ok(res, currentAdmin(res));
  });

  router.get('/summary', guard, async (_req, res) => {
    ok(res, await prices.summary());
  });

  router.get('/prices', guard, async (req, res) => {
    const q = adminPricesQuery.parse(req.query);
    const { items, total } = await prices.list({ commodityId: q.commodity, districtId: q.district, from: q.from, to: q.to }, q.page, q.limit);
    ok(res, items, { page: q.page, pageSize: q.limit, total });
  });

  // Create or update prices. Sending the same commodity, district and date again replaces the earlier entry.
  router.put('/prices', guard, async (req, res) => {
    const batch = priceBatchSchema.parse(req.body);
    const saved = await prices.save(batch.prices, currentAdmin(res).email);
    ok(res, saved, { total: saved.length });
  });

  router.delete('/prices/:id', guard, async (req, res) => {
    const { id } = idParams.parse(req.params);
    await prices.remove(id);
    ok(res, { ok: true });
  });

  return router;
}

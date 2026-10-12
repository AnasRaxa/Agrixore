import type { RequestHandler, Response } from 'express';
import type { AdminProfile } from '@agrixore/shared';
import type { AuthService } from '../modules/admin/authService';
import { forbidden, unauthorized } from '../modules/admin/errors';

export const SESSION_COOKIE = 'agrixore_admin';
/** The cookie is only sent to admin endpoints. */
export const SESSION_COOKIE_PATH = '/api/v1/admin';

export const requireAdmin = (auth: AuthService): RequestHandler => async (req, res, next) => {
  const raw: unknown = req.cookies?.[SESSION_COOKIE];
  const admin = await auth.authenticate(typeof raw === 'string' ? raw : undefined);
  if (!admin) throw unauthorized();
  res.locals.admin = admin;
  next();
};

export const currentAdmin = (res: Response): AdminProfile => res.locals.admin as AdminProfile;

/** Admin responses contain private data and must never be cached. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

/**
 * Defence in depth against cross-site requests: the session cookie is already SameSite=Strict, and on top of that a
 * browser request that changes data must come from this same site. Requests with no Origin header (scripts, curl) are
 * not browser cross-site requests, and they cannot use the cookie from someone else's browser.
 */
export const sameSiteGuard: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin || origin === `${req.protocol}://${req.get('host')}`) return next();
  throw forbidden('This request came from an unexpected website.');
};

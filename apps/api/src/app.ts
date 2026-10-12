import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { Config } from './config/env';
import { createSessions } from './lib/session';
import { errorHandler, notFound } from './middleware/errorHandler';
import { AuthService } from './modules/admin/authService';
import { AdminPriceService } from './modules/admin/priceService';
import type { MandiAdminRepo } from './modules/admin/priceRepo';
import { adminRouter } from './modules/admin/routes';
import type { AdminUserRepo } from './modules/admin/userRepo';
import { healthRouter } from './modules/health/routes';
import { mandiRouter } from './modules/mandi/routes';
import type { MandiRepo } from './modules/mandi/repo';
import { MandiService } from './modules/mandi/service';

export interface AppDeps {
  config: Config;
  logger: Logger;
  mandiRepo: MandiRepo;
  /** Admin dashboard support. It is enabled only when this is given and config.jwtSecret is set. */
  admin?: { users: AdminUserRepo; prices: MandiAdminRepo; /** Clock for tests. */ now?: () => Date };
}

/** Builds the Express app. No side effects (no listening, no database connection), so tests can call it freely. */
export function createApp({ config, logger, mandiRepo, admin }: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  // Behind one reverse proxy in production (needed for correct client IPs in rate limiting).
  app.set('trust proxy', config.env === 'production' ? 1 : false);

  app.use(
    pinoHttp({
      logger,
      autoLogging: config.env !== 'test',
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      // Requests without an Origin header (curl, server-to-server) are allowed; browsers must be on the allowlist.
      origin: (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin)),
      methods: ['GET', 'HEAD', 'OPTIONS'],
      maxAge: 600,
    }),
  );
  app.use(rateLimit({ windowMs: 60_000, limit: config.rateLimitPerMin, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1/health', healthRouter({ repo: mandiRepo }));
  app.use('/api/v1/mandi', mandiRouter(new MandiService(mandiRepo)));

  if (admin && config.jwtSecret) {
    app.use(cookieParser());
    const auth = new AuthService(admin.users, createSessions(config.jwtSecret, config.adminSessionHours));
    // Only failed sign-ins count, so a real admin is not locked out by their own successful logins.
    const loginLimiter = rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      skipSuccessfulRequests: true,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again in a few minutes.' } },
    });
    app.use('/api/v1/admin', adminRouter({ config, auth, prices: new AdminPriceService(admin.prices, admin.now), loginLimiter }));

    // The built dashboard is served from the same site as the API, so its sign-in cookie is first-party.
    const dir = config.adminStaticDir;
    if (dir && existsSync(join(dir, 'index.html'))) {
      app.use('/admin', express.static(dir, { index: false, maxAge: '1h' }));
      app.get('/admin{/*splat}', (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(join(dir, 'index.html'));
      });
      app.get('/', (_req, res) => res.redirect('/admin/'));
    }
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

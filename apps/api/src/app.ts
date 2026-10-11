import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { Config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { healthRouter } from './modules/health/routes';
import { mandiRouter } from './modules/mandi/routes';
import type { MandiRepo } from './modules/mandi/repo';
import { MandiService } from './modules/mandi/service';

export interface AppDeps {
  config: Config;
  logger: Logger;
  mandiRepo: MandiRepo;
}

/** Builds the Express app. No side effects (no listening, no database connection), so tests can call it freely. */
export function createApp({ config, logger, mandiRepo }: AppDeps): express.Express {
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

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

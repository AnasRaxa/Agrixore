import { pino } from 'pino';
import type { Express } from 'express';
import { createApp } from '../app';
import { loadConfig } from '../config/env';
import { InMemoryMandiRepo } from '../modules/mandi/inMemoryRepo';
import type { MandiRepo } from '../modules/mandi/repo';
import { sampleData, type MandiData } from '../modules/mandi/seed';

export function buildTestApp(opts: { data?: MandiData; repo?: MandiRepo; env?: Record<string, string> } = {}): Express {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent', RATE_LIMIT_PER_MIN: '1000', ...opts.env });
  return createApp({
    config,
    logger: pino({ level: 'silent' }),
    mandiRepo: opts.repo ?? new InMemoryMandiRepo(opts.data ?? sampleData),
  });
}

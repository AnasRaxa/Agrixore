import type { Express } from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { createApp } from '../app';
import { loadConfig } from '../config/env';
import { hashPassword } from '../lib/password';
import { InMemoryAdminUserRepo } from '../modules/admin/userRepo.memory';
import { InMemoryMandiRepo } from '../modules/mandi/inMemoryRepo';
import { emptyData, type MandiData } from '../modules/mandi/seed';

/** 12:00 in Pakistan on 2026-10-11. */
export const NOW = new Date('2026-10-11T07:00:00Z');
export const TODAY = '2026-10-11';
export const ADMIN_EMAIL = 'owner@example.com';
export const ADMIN_PASSWORD = 'correct horse battery';

export async function buildAdminApp(opts: { data?: MandiData; env?: Record<string, string>; withAdmin?: boolean } = {}): Promise<{ app: Express; repo: InMemoryMandiRepo }> {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent', RATE_LIMIT_PER_MIN: '1000', JWT_SECRET: 'x'.repeat(40), CORS_ORIGINS: 'https://farmer.example', ...opts.env });
  const repo = new InMemoryMandiRepo(opts.data ?? emptyData, () => NOW);
  const users = new InMemoryAdminUserRepo();
  // A low cost keeps tests fast. The stored hash records its own cost, so verification still works.
  await users.create({ email: ADMIN_EMAIL, passwordHash: await hashPassword(ADMIN_PASSWORD, { N: 1024, r: 8, p: 1 }) });
  const app = createApp({ config, logger: pino({ level: 'silent' }), mandiRepo: repo, admin: opts.withAdmin === false ? undefined : { users, prices: repo, now: () => NOW } });
  return { app, repo };
}

/** A supertest agent that keeps cookies, already signed in as the admin. */
export async function signedInAgent(app: Express) {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (res.status !== 200) throw new Error(`test sign-in failed: ${res.status}`);
  return agent;
}

export const price = (over: Record<string, unknown> = {}) => ({ commodityId: 'wheat', districtId: 'lahore', marketDate: TODAY, min: 3800, modal: 4000, max: 4200, ...over });

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { InMemoryMandiRepo } from './modules/mandi/inMemoryRepo';
import { emptyData } from './modules/mandi/seed';
import { buildTestApp } from './test/helpers';

describe('health', () => {
  it('liveness returns the standard envelope', async () => {
    const res = await request(buildTestApp()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', service: 'agrixore-api' });
  });

  it('readiness is 200 when the data store answers', async () => {
    const res = await request(buildTestApp()).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ready');
  });

  it('readiness is 503 when the data store is down', async () => {
    const repo = new InMemoryMandiRepo(emptyData);
    repo.ping = async () => false;
    const res = await request(buildTestApp({ repo })).get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NOT_READY');
  });
});

describe('errors and security', () => {
  it('unknown routes return a JSON 404', async () => {
    const res = await request(buildTestApp()).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('malformed JSON is a 400, not a 500', async () => {
    const res = await request(buildTestApp()).post('/api/v1/mandi/prices').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBeLessThan(500);
    expect(res.body.error).toBeDefined();
  });

  it('unexpected failures return a generic 500 without internals', async () => {
    const repo = new InMemoryMandiRepo(emptyData);
    repo.listCommodities = async () => { throw new Error('secret database detail'); };
    const res = await request(buildTestApp({ repo })).get('/api/v1/mandi/commodities');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(buildTestApp()).get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('allows configured browser origins only', async () => {
    const app = buildTestApp({ env: { CORS_ORIGINS: 'https://app.example' } });
    const allowed = await request(app).get('/api/v1/health').set('Origin', 'https://app.example');
    const blocked = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://app.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rate limits repeated requests', async () => {
    const app = buildTestApp({ env: { RATE_LIMIT_PER_MIN: '2' } });
    await request(app).get('/api/v1/health');
    await request(app).get('/api/v1/health');
    const third = await request(app).get('/api/v1/health');
    expect(third.status).toBe(429);
  });
});

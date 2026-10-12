import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ADMIN_EMAIL, ADMIN_PASSWORD, TODAY, buildAdminApp, price, signedInAgent } from '../../test/adminHelpers';
import { sampleData } from '../mandi/seed';

describe('admin sign-in', () => {
  it('signs in and sets a protected session cookie', async () => {
    const { app } = await buildAdminApp();
    const res = await request(app).post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: ADMIN_EMAIL, role: 'admin' });
    expect(res.body.data.passwordHash).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/admin/);
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it('marks the cookie Secure in production', async () => {
    const { app } = await buildAdminApp({ env: { COOKIE_SECURE: 'true' } });
    const res = await request(app).post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(String(res.headers['set-cookie'])).toMatch(/Secure/i);
  });
  it('treats the email case-insensitively', async () => {
    const { app } = await buildAdminApp();
    const res = await request(app).post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL.toUpperCase(), password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
  });
  it('gives the same answer for a wrong password and an unknown email', async () => {
    const { app } = await buildAdminApp();
    const wrong = await request(app).post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL, password: 'nope nope nope' });
    const unknown = await request(app).post('/api/v1/admin/auth/login').send({ email: 'someone@else.com', password: 'nope nope nope' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });
  it('rejects malformed login bodies', async () => {
    const { app } = await buildAdminApp();
    expect((await request(app).post('/api/v1/admin/auth/login').send({ email: 'not-an-email', password: 'x' })).status).toBe(400);
    expect((await request(app).post('/api/v1/admin/auth/login').send({})).status).toBe(400);
    expect((await request(app).post('/api/v1/admin/auth/login').set('Content-Type', 'application/json').send('{bad json')).status).toBe(400);
  });
  it('knows who is signed in, and signs out', async () => {
    const { app } = await buildAdminApp();
    expect((await request(app).get('/api/v1/admin/auth/me')).status).toBe(401);
    const agent = await signedInAgent(app);
    expect((await agent.get('/api/v1/admin/auth/me')).body.data.email).toBe(ADMIN_EMAIL);
    expect((await agent.post('/api/v1/admin/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/v1/admin/auth/me')).status).toBe(401);
  });
  it('rejects a forged or garbage session cookie', async () => {
    const { app } = await buildAdminApp();
    expect((await request(app).get('/api/v1/admin/auth/me').set('Cookie', 'agrixore_admin=garbage')).status).toBe(401);
  });
  it('slows down repeated wrong passwords', async () => {
    const { app } = await buildAdminApp();
    const codes: number[] = [];
    for (let i = 0; i < 12; i++) codes.push((await request(app).post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL, password: `wrong password ${i}` })).status);
    expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
    expect(codes.slice(10)).toEqual([429, 429]);
  });
});

describe('the dashboard is off without JWT_SECRET', () => {
  it('has no admin endpoints at all', async () => {
    const { app } = await buildAdminApp({ withAdmin: false });
    expect((await request(app).get('/api/v1/admin/auth/me')).status).toBe(404);
    expect((await request(app).post('/api/v1/admin/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })).status).toBe(404);
  });
});

describe('admin endpoints need a sign-in', () => {
  it.each([
    ['get', '/api/v1/admin/summary'],
    ['get', '/api/v1/admin/prices'],
    ['put', '/api/v1/admin/prices'],
    ['delete', '/api/v1/admin/prices/aaaaaaaaaaaaaaaaaaaaaaaa'],
  ] as const)('%s %s returns 401 without a session', async (method, path) => {
    const { app } = await buildAdminApp();
    const res = await request(app)[method](path).send({ prices: [price()] });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('setting prices', () => {
  it('saves prices and records who saved them', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    const res = await agent.put('/api/v1/admin/prices').send({ prices: [price(), price({ commodityId: 'rice', min: 5800, modal: 6000, max: 6200 })] });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data[0]).toMatchObject({ source: 'manual', sample: false, updatedBy: ADMIN_EMAIL, unit: 'PKR/40kg', marketId: 'lahore-manual' });
  });
  it('replaces an earlier entry for the same commodity, district and date', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    const first = await agent.put('/api/v1/admin/prices').send({ prices: [price()] });
    const second = await agent.put('/api/v1/admin/prices').send({ prices: [price({ modal: 4100, max: 4300 })] });
    expect(second.body.data[0].id).toBe(first.body.data[0].id);
    const list = await agent.get('/api/v1/admin/prices');
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0].modal).toBe(4100);
  });
  it('explains every invalid field', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    const res = await agent.put('/api/v1/admin/prices').send({ prices: [price({ min: 4500 }), price({ commodityId: 'gold' }), price({ modal: 0 }), price({ marketDate: '2026-02-30' })] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['prices.0.modal', 'prices.1.commodityId', 'prices.2.modal', 'prices.3.marketDate']));
  });
  it('rejects dates in the future, empty batches and duplicates', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    const future = await agent.put('/api/v1/admin/prices').send({ prices: [price({ marketDate: '2026-10-12' })] });
    expect(future.status).toBe(400);
    expect(future.body.error.details[0]).toEqual({ path: 'prices.0.marketDate', message: 'The date is in the future' });
    expect((await agent.put('/api/v1/admin/prices').send({ prices: [] })).status).toBe(400);
    expect((await agent.put('/api/v1/admin/prices').send({ prices: [price(), price()] })).status).toBe(400);
    expect((await agent.put('/api/v1/admin/prices').send({})).status).toBe(400);
  });
  it('accepts today and past dates', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    expect((await agent.put('/api/v1/admin/prices').send({ prices: [price({ marketDate: TODAY }), price({ marketDate: '2026-09-01' })] })).status).toBe(200);
  });
  it('refuses oversized requests', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    expect((await agent.put('/api/v1/admin/prices').send({ prices: [price()], junk: 'x'.repeat(200_000) })).status).toBe(413);
  });
});

describe('browsing and deleting prices', () => {
  async function seeded() {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    await agent.put('/api/v1/admin/prices').send({
      prices: [
        price({ marketDate: '2026-10-09', modal: 3900, min: 3700, max: 4100 }),
        price(),
        price({ districtId: 'multan', modal: 4200, min: 4000, max: 4400 }),
        price({ commodityId: 'rice', min: 5800, modal: 6000, max: 6200 }),
      ],
    });
    return { app, agent };
  }
  it('lists newest first, filters and paginates', async () => {
    const { agent } = await seeded();
    const all = await agent.get('/api/v1/admin/prices');
    expect(all.body.meta).toEqual({ page: 1, pageSize: 50, total: 4 });
    expect(all.body.data[3].marketDate).toBe('2026-10-09');
    expect((await agent.get('/api/v1/admin/prices?commodity=rice')).body.meta.total).toBe(1);
    expect((await agent.get('/api/v1/admin/prices?district=multan&commodity=')).body.meta.total).toBe(1);
    expect((await agent.get('/api/v1/admin/prices?from=2026-10-10')).body.meta.total).toBe(3);
    expect((await agent.get('/api/v1/admin/prices?limit=3&page=2')).body.data).toHaveLength(1);
  });
  it('rejects bad filters', async () => {
    const { agent } = await seeded();
    expect((await agent.get('/api/v1/admin/prices?commodity=gold')).status).toBe(400);
    expect((await agent.get('/api/v1/admin/prices?limit=9999')).status).toBe(400);
  });
  it('deletes a price once, then says it is gone', async () => {
    const { agent } = await seeded();
    const id = (await agent.get('/api/v1/admin/prices?commodity=rice')).body.data[0].id;
    expect((await agent.delete(`/api/v1/admin/prices/${id}`)).status).toBe(200);
    expect((await agent.delete(`/api/v1/admin/prices/${id}`)).status).toBe(404);
    expect((await agent.get('/api/v1/admin/prices')).body.meta.total).toBe(3);
    expect((await agent.delete('/api/v1/admin/prices/not-an-id')).status).toBe(400);
  });
  it('summarises coverage and freshness for the dashboard', async () => {
    const { agent } = await seeded();
    const { data } = (await agent.get('/api/v1/admin/summary')).body;
    expect(data).toMatchObject({ today: TODAY, totalEntries: 4, entriesToday: 3 });
    expect(data.commodities.find((c: { commodityId: string }) => c.commodityId === 'wheat')).toEqual({ commodityId: 'wheat', latestMarketDate: TODAY, districtsCovered: 2 });
    expect(data.commodities.find((c: { commodityId: string }) => c.commodityId === 'tomato')).toEqual({ commodityId: 'tomato', latestMarketDate: null, districtsCovered: 0 });
    expect(data.commodities).toHaveLength(7);
  });
});

describe('what farmers see (the existing public endpoints)', () => {
  it('shows a saved price in /mandi/prices/latest as real, labelled data', async () => {
    const { app } = await buildAdminApp();
    expect((await request(app).get('/api/v1/mandi/prices/latest')).body.data).toEqual([]);
    const agent = await signedInAgent(app);
    await agent.put('/api/v1/admin/prices').send({ prices: [price({ marketDate: '2026-10-08', modal: 3900, min: 3700, max: 4100 }), price(), price({ districtId: 'multan', modal: 4200, min: 4000, max: 4400 })] });
    const res = await request(app).get('/api/v1/mandi/prices/latest');
    expect(res.body.data).toHaveLength(2);
    const lahore = res.body.data.find((p: { districtId: string }) => p.districtId === 'lahore');
    expect(lahore).toEqual({ commodityId: 'wheat', marketId: 'lahore-manual', districtId: 'lahore', marketDate: TODAY, min: 3800, modal: 4000, max: 4200, unit: 'PKR/40kg', currency: 'PKR', source: 'manual', sample: false });
    expect(lahore.updatedBy).toBeUndefined();
    expect(lahore.id).toBeUndefined();
  });
  it('stops showing a price once it is deleted', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    const saved = await agent.put('/api/v1/admin/prices').send({ prices: [price()] });
    await agent.delete(`/api/v1/admin/prices/${saved.body.data[0].id}`);
    expect((await request(app).get('/api/v1/mandi/prices/latest')).body.data).toEqual([]);
  });
  it('keeps sample rows flagged and separate from real ones, and never edits the shared sample data', async () => {
    const before = sampleData.prices.length;
    const { app } = await buildAdminApp({ data: sampleData });
    const agent = await signedInAgent(app);
    await agent.put('/api/v1/admin/prices').send({ prices: [price()] });
    const rows = (await request(app).get('/api/v1/mandi/prices/latest?commodity=wheat&district=lahore')).body.data as Array<{ sample: boolean; source: string }>;
    expect(rows.map((r) => [r.source, r.sample]).sort()).toEqual([['manual', false], ['sample', true]]);
    expect(sampleData.prices).toHaveLength(before);
    expect((await agent.get('/api/v1/admin/prices')).body.meta.total).toBe(1); // sample rows are not manageable here
  });
  it('is readable from the allowed farmer-app origin only', async () => {
    const { app } = await buildAdminApp();
    const ok = await request(app).get('/api/v1/mandi/prices/latest').set('Origin', 'https://farmer.example');
    expect(ok.headers['access-control-allow-origin']).toBe('https://farmer.example');
    const other = await request(app).get('/api/v1/mandi/prices/latest').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('cross-site protection', () => {
  it('refuses data-changing requests from any other website, even an allowed farmer-app origin', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    for (const origin of ['https://evil.example', 'https://farmer.example']) {
      expect((await agent.put('/api/v1/admin/prices').set('Origin', origin).send({ prices: [price()] })).status, origin).toBe(403);
      expect((await request(app).post('/api/v1/admin/auth/login').set('Origin', origin).send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })).status, origin).toBe(403);
    }
  });
  it('accepts requests from its own origin', async () => {
    const { app } = await buildAdminApp();
    const agent = await signedInAgent(app);
    const res = await agent.put('/api/v1/admin/prices').set('Host', 'api.test').set('Origin', 'http://api.test').send({ prices: [price()] });
    expect(res.status).toBe(200);
  });
});

describe('serving the admin dashboard', () => {
  function adminDir() {
    const dir = mkdtempSync(join(tmpdir(), 'admin-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>Agrixore Admin</title><div id="root"></div>');
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'assets', 'app.js'), 'console.log("hi")');
    return dir;
  }
  it('serves the app at /admin/, on deep links, and its assets', async () => {
    const { app } = await buildAdminApp({ env: { ADMIN_STATIC_DIR: adminDir() } });
    const bare = await request(app).get('/admin');
    expect([bare.status, bare.headers.location]).toEqual([301, '/admin/']);
    for (const path of ['/admin/', '/admin/prices', '/admin/prices/anything']) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(200);
      expect(res.text).toContain('Agrixore Admin');
    }
    const asset = await request(app).get('/admin/assets/app.js');
    expect(asset.status).toBe(200);
    expect(asset.headers['content-type']).toMatch(/javascript/);
  });
  it('sends the site root to the dashboard and still answers unknown API paths with JSON', async () => {
    const { app } = await buildAdminApp({ env: { ADMIN_STATIC_DIR: adminDir() } });
    const root = await request(app).get('/');
    expect([root.status, root.headers.location]).toEqual([302, '/admin/']);
    expect((await request(app).get('/api/v1/nope')).body.error.code).toBe('NOT_FOUND');
  });
  it('does not serve the dashboard when it has not been built, or when admin is off', async () => {
    const missing = await buildAdminApp({ env: { ADMIN_STATIC_DIR: join(tmpdir(), 'does-not-exist') } });
    expect((await request(missing.app).get('/admin/')).status).toBe(404);
    const off = await buildAdminApp({ withAdmin: false, env: { ADMIN_STATIC_DIR: adminDir() } });
    expect((await request(off.app).get('/admin/')).status).toBe(404);
  });
  it('sets security headers on the dashboard', async () => {
    const { app } = await buildAdminApp({ env: { ADMIN_STATIC_DIR: adminDir() } });
    const res = await request(app).get('/admin/');
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

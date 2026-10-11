import type { MandiPriceDto } from '@agrixore/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../../test/helpers';
import { emptyData, sampleData, type MandiData } from './seed';

const row = (over: Partial<MandiPriceDto>): MandiPriceDto => ({
  commodityId: 'wheat', marketId: 'm1', districtId: 'faisalabad', marketDate: '2026-01-10',
  min: 100, modal: 110, max: 120, unit: 'PKR/40kg', currency: 'PKR', source: 'test-fixture', sample: false, ...over,
});

// Test fixture values only. They are not real prices.
const fixture: MandiData = {
  commodities: sampleData.commodities,
  markets: sampleData.markets,
  prices: [
    row({ marketDate: '2026-01-08', modal: 101 }),
    row({ marketDate: '2026-01-09', modal: 105 }),
    row({ marketDate: '2026-01-10', modal: 110 }),
    row({ commodityId: 'rice', marketDate: '2026-01-10', modal: 210 }),
    row({ marketId: 'm2', districtId: 'multan', marketDate: '2026-01-09', modal: 120 }),
  ],
};

describe('GET /mandi/commodities and /markets', () => {
  it('lists commodities with Urdu and English names', async () => {
    const res = await request(buildTestApp()).get('/api/v1/mandi/commodities');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(7);
    expect(res.body.data[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: { en: expect.any(String), ur: expect.any(String) }, unit: 'PKR/40kg' }));
  });

  it('filters markets by district', async () => {
    const res = await request(buildTestApp()).get('/api/v1/mandi/markets?district=vehari');
    expect(res.body.data.map((m: { districtId: string }) => m.districtId)).toEqual(['vehari']);
  });
});

describe('GET /mandi/prices', () => {
  it('filters by commodity and district', async () => {
    const res = await request(buildTestApp({ data: fixture })).get('/api/v1/mandi/prices?commodity=wheat&district=multan');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ districtId: 'multan', modal: 120 });
  });

  it('returns the newest market day first', async () => {
    const res = await request(buildTestApp({ data: fixture })).get('/api/v1/mandi/prices?commodity=wheat&district=faisalabad');
    expect(res.body.data.map((r: MandiPriceDto) => r.marketDate)).toEqual(['2026-01-10', '2026-01-09', '2026-01-08']);
  });

  it('filters by date range (inclusive)', async () => {
    const res = await request(buildTestApp({ data: fixture })).get('/api/v1/mandi/prices?commodity=wheat&district=faisalabad&from=2026-01-09&to=2026-01-09');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].marketDate).toBe('2026-01-09');
  });

  it('paginates and reports totals', async () => {
    const res = await request(buildTestApp({ data: fixture })).get('/api/v1/mandi/prices?pageSize=2&page=2');
    expect(res.body.meta).toEqual({ page: 2, pageSize: 2, total: 5 });
    expect(res.body.data).toHaveLength(2);
  });

  it.each([
    ['pageSize=0'], ['pageSize=501'], ['page=0'], ['from=yesterday'], ['from=2026-02-01&to=2026-01-01'], ['commodity=Wheat!'],
  ])('rejects invalid query %s with a 400', async (qs) => {
    const res = await request(buildTestApp()).get(`/api/v1/mandi/prices?${qs}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /mandi/prices/latest', () => {
  it('returns one row per commodity and market, the newest', async () => {
    const res = await request(buildTestApp({ data: fixture })).get('/api/v1/mandi/prices/latest');
    expect(res.status).toBe(200);
    const keys = res.body.data.map((r: MandiPriceDto) => `${r.commodityId}|${r.marketId}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(res.body.data.find((r: MandiPriceDto) => r.commodityId === 'wheat' && r.marketId === 'm1')).toMatchObject({ marketDate: '2026-01-10', modal: 110 });
  });
});

describe('sample data safety', () => {
  it('flags every sample row as sample', async () => {
    const res = await request(buildTestApp()).get('/api/v1/mandi/prices/latest');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((r: MandiPriceDto) => r.sample === true && r.source === 'sample')).toBe(true);
  });

  it('never invents prices: with no data the list is empty', async () => {
    const res = await request(buildTestApp({ data: emptyData })).get('/api/v1/mandi/prices/latest');
    expect(res.body.data).toEqual([]);
  });

  it('lets clients cache price lists briefly', async () => {
    const res = await request(buildTestApp()).get('/api/v1/mandi/prices/latest');
    expect(res.headers['cache-control']).toContain('max-age=300');
  });
});

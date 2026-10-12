import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PriceInput } from '@agrixore/shared';
import { InMemoryMandiRepo } from '../mandi/inMemoryRepo';
import { MongoMandiRepo, PriceModel } from '../mandi/mongoRepo';
import { emptyData } from '../mandi/seed';
import type { MandiRepo } from '../mandi/repo';
import type { MandiAdminRepo } from './priceRepo';

type Repo = MandiAdminRepo & MandiRepo;
const p = (over: Partial<PriceInput> = {}): PriceInput => ({ commodityId: 'wheat', districtId: 'lahore', marketDate: '2026-10-11', min: 3800, modal: 4000, max: 4200, ...over });
const page = { skip: 0, limit: 50 };

interface Harness { repo: Repo; reset: () => Promise<void>; close?: () => Promise<void> }

/**
 * The same behaviour must hold for the in-memory repo (used by the other tests and by `pnpm dev`) and the MongoDB repo.
 * The MongoDB run needs TEST_MONGODB_URI, a throwaway database whose price collection is emptied, and is skipped otherwise.
 */
function contract(name: string, make: () => Promise<Harness>, skip = false) {
  describe.skipIf(skip)(`manual price repo: ${name}`, () => {
    let h: Harness;
    let repo: Repo;
    beforeAll(async () => {
      h = await make();
    });
    beforeEach(async () => {
      await h.reset();
      repo = h.repo;
    });
    afterAll(() => h.close?.());

    it('inserts, then updates in place for the same commodity, district and date', async () => {
      const [first] = await repo.upsertManualPrices([p()], 'a@x.co');
      const [second] = await repo.upsertManualPrices([p({ modal: 4100, max: 4300 })], 'b@x.co');
      expect(second?.id).toBe(first?.id);
      expect(second).toMatchObject({ modal: 4100, max: 4300, updatedBy: 'b@x.co', source: 'manual', sample: false, unit: 'PKR/40kg', marketId: 'lahore-manual', currency: 'PKR' });
      expect(await repo.countManualPrices()).toBe(1);
    });
    it('keeps different dates, districts and commodities apart', async () => {
      await repo.upsertManualPrices([p(), p({ marketDate: '2026-10-10' }), p({ districtId: 'multan' }), p({ commodityId: 'rice' })], 'a@x.co');
      expect(await repo.countManualPrices()).toBe(4);
      expect(await repo.countManualPrices({ marketDate: '2026-10-11' })).toBe(3);
    });
    it('returns the saved records from a batch', async () => {
      const saved = await repo.upsertManualPrices([p(), p({ commodityId: 'rice' })], 'a@x.co');
      expect(saved).toHaveLength(2);
      expect(saved.every((r) => r.id.length === 24 && r.updatedAt.endsWith('Z') && r.marketDate === '2026-10-11')).toBe(true);
    });
    it('lists newest first with filters, ranges and paging', async () => {
      await repo.upsertManualPrices([p({ marketDate: '2026-10-09' }), p(), p({ districtId: 'multan' }), p({ commodityId: 'rice' })], 'a@x.co');
      const all = await repo.listManualPrices({}, page);
      expect(all.total).toBe(4);
      expect(all.items[3]?.marketDate).toBe('2026-10-09');
      expect((await repo.listManualPrices({ commodityId: 'rice' }, page)).total).toBe(1);
      expect((await repo.listManualPrices({ districtId: 'multan' }, page)).total).toBe(1);
      expect((await repo.listManualPrices({ from: '2026-10-10' }, page)).total).toBe(3);
      expect((await repo.listManualPrices({ to: '2026-10-10' }, page)).total).toBe(1);
      const last = await repo.listManualPrices({}, { skip: 3, limit: 3 });
      expect(last.items).toHaveLength(1);
      expect(last.total).toBe(4);
    });
    it('finds the newest manual price per commodity and district, optionally ignoring old ones', async () => {
      await repo.upsertManualPrices([p({ marketDate: '2026-10-08', modal: 3900, min: 3700 }), p(), p({ districtId: 'multan', marketDate: '2026-08-01' })], 'a@x.co');
      const latest = await repo.latestManualPrices({});
      expect(latest).toHaveLength(2);
      expect(latest.find((r) => r.districtId === 'lahore')).toMatchObject({ marketDate: '2026-10-11', modal: 4000 });
      expect((await repo.latestManualPrices({ from: '2026-10-01' })).map((r) => r.districtId)).toEqual(['lahore']);
    });
    it('deletes by id once, and only manual rows', async () => {
      const [saved] = await repo.upsertManualPrices([p()], 'a@x.co');
      expect(await repo.deleteManualPrice(saved!.id)).toBe(true);
      expect(await repo.deleteManualPrice(saved!.id)).toBe(false);
      expect(await repo.deleteManualPrice('not-an-id')).toBe(false);
      expect(await repo.countManualPrices()).toBe(0);
    });
    it('reports when prices were last changed', async () => {
      expect(await repo.lastManualUpdate()).toBeNull();
      const [saved] = await repo.upsertManualPrices([p()], 'a@x.co');
      expect(await repo.lastManualUpdate()).toBe(saved?.updatedAt);
    });
    it('is visible through the farmer-facing read methods as real, unsampled data', async () => {
      await repo.upsertManualPrices([p(), p({ marketDate: '2026-10-10', modal: 3950, min: 3750 })], 'a@x.co');
      const found = await repo.findPrices({ districtId: 'lahore' }, page);
      expect(found.total).toBe(2);
      expect(found.rows[0]).toEqual({ commodityId: 'wheat', marketId: 'lahore-manual', districtId: 'lahore', marketDate: '2026-10-11', min: 3800, modal: 4000, max: 4200, unit: 'PKR/40kg', currency: 'PKR', source: 'manual', sample: false });
    });
  });
}

contract('in memory', async () => {
  const h: Harness = { repo: new InMemoryMandiRepo(emptyData), reset: async () => void (h.repo = new InMemoryMandiRepo(emptyData)) };
  return h;
});

const uri = process.env.TEST_MONGODB_URI;
contract(
  'MongoDB',
  async () => {
    await mongoose.connect(uri!, { serverSelectionTimeoutMS: 5000 });
    await PriceModel.init();
    return { repo: new MongoMandiRepo(), reset: async () => void (await PriceModel.deleteMany({})), close: () => mongoose.disconnect() };
  },
  !uri,
);

// `latestPrices` (farmer-facing) uses a standard MongoDB aggregation ($group with $first). It is not part of the contract above
// because the stand-in database used in development (FerretDB) does not implement $first; verify it on a real MongoDB / Atlas.

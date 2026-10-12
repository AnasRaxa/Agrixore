import mongoose, { Schema, type QueryFilter } from 'mongoose';
import { MANDI_UNIT, MANUAL_SOURCE, manualMarketId } from '@agrixore/shared';
import type { AdminPriceDto, CommodityDto, CommodityId, Lang2, MandiPriceDto, MarketDto, PriceInput } from '@agrixore/shared';
import { mongoIsReady } from '../../db/connect';
import type { AdminPriceFilter, MandiAdminRepo } from '../admin/priceRepo';
import type { MandiRepo, PriceQuery } from './repo';

interface CommodityDoc { _id: string; name: Lang2; unit: string }
interface MarketDoc { _id: string; name: Lang2; districtId: string }
interface PriceDoc extends Omit<MandiPriceDto, never> { ingestedAt: Date; /** set for manual prices */ updatedBy?: string; updatedAt?: Date }

const name = { en: { type: String, required: true }, ur: { type: String, required: true } };

const commoditySchema = new Schema<CommodityDoc>({ _id: { type: String, required: true }, name, unit: { type: String, required: true } }, { versionKey: false });
const marketSchema = new Schema<MarketDoc>({ _id: { type: String, required: true }, name, districtId: { type: String, required: true, index: true } }, { versionKey: false });
const priceSchema = new Schema<PriceDoc>(
  {
    commodityId: { type: String, required: true },
    marketId: { type: String, required: true },
    districtId: { type: String, required: true },
    marketDate: { type: String, default: null },
    min: { type: Number, required: true },
    modal: { type: Number, required: true },
    max: { type: Number, required: true },
    unit: { type: String, required: true },
    currency: { type: String, enum: ['PKR'], default: 'PKR' },
    source: { type: String, required: true },
    sample: { type: Boolean, default: false },
    ingestedAt: { type: Date, default: Date.now },
    updatedBy: { type: String },
    updatedAt: { type: Date },
  },
  { versionKey: false },
);
// One row per commodity + market + day, so re-importing the same day updates instead of duplicating.
priceSchema.index({ commodityId: 1, marketId: 1, marketDate: -1 }, { unique: true });
priceSchema.index({ districtId: 1, marketDate: -1 });

export const CommodityModel = mongoose.models.Commodity ?? mongoose.model<CommodityDoc>('Commodity', commoditySchema);
export const MarketModel = mongoose.models.Market ?? mongoose.model<MarketDoc>('Market', marketSchema);
export const PriceModel = mongoose.models.MandiPrice ?? mongoose.model<PriceDoc>('MandiPrice', priceSchema);

const toPriceDto = (d: PriceDoc & { _id?: unknown }): MandiPriceDto => ({
  commodityId: d.commodityId, marketId: d.marketId, districtId: d.districtId, marketDate: d.marketDate ?? null,
  min: d.min, modal: d.modal, max: d.max, unit: d.unit, currency: 'PKR', source: d.source, sample: d.sample,
});

function priceFilter(q: PriceQuery): QueryFilter<PriceDoc> {
  const filter: QueryFilter<PriceDoc> = {};
  if (q.commodityId) filter.commodityId = q.commodityId;
  if (q.districtId) filter.districtId = q.districtId;
  if (q.marketId) filter.marketId = q.marketId;
  if (q.from || q.to) filter.marketDate = { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lte: q.to } : {}) };
  return filter;
}

/** MongoDB-backed repo. NOTE: written to match InMemoryMandiRepo, but not run in CI yet (needs a MongoDB instance). */
export class MongoMandiRepo implements MandiRepo, MandiAdminRepo {
  async listCommodities(): Promise<CommodityDto[]> {
    const docs = await CommodityModel.find().sort({ _id: 1 }).lean<CommodityDoc[]>();
    return docs.map((d) => ({ id: d._id, name: d.name, unit: d.unit }));
  }

  async listMarkets(districtId?: string): Promise<MarketDto[]> {
    const docs = await MarketModel.find(districtId ? { districtId } : {}).sort({ _id: 1 }).lean<MarketDoc[]>();
    return docs.map((d) => ({ id: d._id, name: d.name, districtId: d.districtId }));
  }

  async findPrices(query: PriceQuery, page: { skip: number; limit: number }) {
    const filter = priceFilter(query);
    const [docs, total] = await Promise.all([
      PriceModel.find(filter).sort({ marketDate: -1, commodityId: 1, marketId: 1 }).skip(page.skip).limit(page.limit).lean<PriceDoc[]>(),
      PriceModel.countDocuments(filter),
    ]);
    return { rows: docs.map(toPriceDto), total };
  }

  async latestPrices(query: Pick<PriceQuery, 'commodityId' | 'districtId' | 'marketId'>) {
    const docs = await PriceModel.aggregate<PriceDoc>([
      { $match: priceFilter(query) },
      { $sort: { marketDate: -1 } },
      { $group: { _id: { c: '$commodityId', m: '$marketId' }, doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { commodityId: 1, marketId: 1 } },
    ]);
    return docs.map(toPriceDto);
  }

  async ping() {
    return mongoIsReady();
  }

  // ---- write side: manual prices entered by an admin

  async upsertManualPrices(inputs: PriceInput[], editor: string): Promise<AdminPriceDto[]> {
    const at = new Date();
    await PriceModel.bulkWrite(
      inputs.map((i) => ({
        updateOne: {
          filter: { commodityId: i.commodityId, marketId: manualMarketId(i.districtId), marketDate: i.marketDate },
          update: {
            $set: {
              districtId: i.districtId, min: i.min, modal: i.modal, max: i.max, unit: MANDI_UNIT, currency: 'PKR', source: MANUAL_SOURCE, sample: false, updatedBy: editor, updatedAt: at,
            },
            $setOnInsert: { ingestedAt: at },
          },
          upsert: true,
        },
      })),
    );
    const docs = await PriceModel.find({
      $or: inputs.map((i) => ({ commodityId: i.commodityId, marketId: manualMarketId(i.districtId), marketDate: i.marketDate })),
    }).lean<ManualDoc[]>();
    return docs.map(toAdminDto).sort(byNewestFirst);
  }

  async listManualPrices(filter: AdminPriceFilter, page: { skip: number; limit: number }) {
    const q = manualFilter(filter);
    const [docs, total] = await Promise.all([
      PriceModel.find(q).sort({ marketDate: -1, commodityId: 1, districtId: 1 }).skip(page.skip).limit(page.limit).lean<ManualDoc[]>(),
      PriceModel.countDocuments(q),
    ]);
    return { items: docs.map(toAdminDto), total };
  }

  async latestManualPrices(filter: { from?: string }) {
    // Plain queries only: newest first, then keep the first row for each commodity and district.
    // The `from` window keeps the amount of data small.
    const docs = await PriceModel.find(manualFilter({ from: filter.from })).sort({ marketDate: -1, updatedAt: -1 }).lean<ManualDoc[]>();
    const newest = new Map<string, ManualDoc>();
    for (const d of docs) {
      const key = `${d.commodityId}|${d.districtId}`;
      if (!newest.has(key)) newest.set(key, d);
    }
    return [...newest.values()].map(toAdminDto);
  }

  async deleteManualPrice(id: string) {
    if (!/^[a-f0-9]{24}$/i.test(id)) return false;
    // Only manual rows can be deleted from the dashboard.
    const res = await PriceModel.deleteOne({ _id: id, source: MANUAL_SOURCE });
    return res.deletedCount === 1;
  }

  countManualPrices(filter?: { marketDate?: string }) {
    return PriceModel.countDocuments({ source: MANUAL_SOURCE, ...(filter?.marketDate ? { marketDate: filter.marketDate } : {}) });
  }

  async lastManualUpdate() {
    const doc = await PriceModel.findOne({ source: MANUAL_SOURCE }).sort({ updatedAt: -1 }).select('updatedAt').lean<{ updatedAt?: Date } | null>();
    return doc?.updatedAt ? doc.updatedAt.toISOString() : null;
  }
}

type ManualDoc = PriceDoc & { _id: { toString(): string } };

function manualFilter(f: AdminPriceFilter): QueryFilter<PriceDoc> {
  const filter: QueryFilter<PriceDoc> = { source: MANUAL_SOURCE };
  if (f.commodityId) filter.commodityId = f.commodityId;
  if (f.districtId) filter.districtId = f.districtId;
  if (f.from || f.to) filter.marketDate = { ...(f.from ? { $gte: f.from } : {}), ...(f.to ? { $lte: f.to } : {}) };
  return filter;
}

const toAdminDto = (d: ManualDoc): AdminPriceDto => ({
  id: d._id.toString(),
  // Only validated commodity ids are ever written, so narrowing the stored string is safe.
  commodityId: d.commodityId as CommodityId,
  marketId: d.marketId,
  districtId: d.districtId,
  marketDate: d.marketDate as string,
  min: d.min, modal: d.modal, max: d.max, unit: d.unit, currency: 'PKR', source: MANUAL_SOURCE, sample: false,
  updatedBy: d.updatedBy ?? '',
  updatedAt: (d.updatedAt ?? d.ingestedAt).toISOString(),
});

const byNewestFirst = (a: AdminPriceDto, b: AdminPriceDto): number =>
  b.marketDate.localeCompare(a.marketDate) || a.commodityId.localeCompare(b.commodityId) || a.districtId.localeCompare(b.districtId);

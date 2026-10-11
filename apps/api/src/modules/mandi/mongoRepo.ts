import mongoose, { Schema, type QueryFilter } from 'mongoose';
import type { CommodityDto, Lang2, MandiPriceDto, MarketDto } from '@agrixore/shared';
import { mongoIsReady } from '../../db/connect';
import type { MandiRepo, PriceQuery } from './repo';

interface CommodityDoc { _id: string; name: Lang2; unit: string }
interface MarketDoc { _id: string; name: Lang2; districtId: string }
interface PriceDoc extends Omit<MandiPriceDto, never> { ingestedAt: Date }

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
export class MongoMandiRepo implements MandiRepo {
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
}

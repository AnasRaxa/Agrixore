// Loads the made-up SAMPLE mandi data into MongoDB for development. Refuses to run in production.
import { loadConfig } from '../config/env';
import { connectMongo, disconnectMongo } from '../db/connect';
import { CommodityModel, MarketModel, PriceModel } from '../modules/mandi/mongoRepo';
import { sampleData } from '../modules/mandi/seed';

const config = loadConfig();
if (config.env === 'production') throw new Error('Refusing to load sample data in production.');
if (!config.mongoUri) throw new Error('Set MONGODB_URI to seed MongoDB.');

await connectMongo(config.mongoUri);
await CommodityModel.bulkWrite(sampleData.commodities.map((c) => ({ replaceOne: { filter: { _id: c.id }, replacement: { _id: c.id, name: c.name, unit: c.unit }, upsert: true } })));
await MarketModel.bulkWrite(sampleData.markets.map((m) => ({ replaceOne: { filter: { _id: m.id }, replacement: { _id: m.id, name: m.name, districtId: m.districtId }, upsert: true } })));
await PriceModel.bulkWrite(
  sampleData.prices.map((p) => ({
    replaceOne: { filter: { commodityId: p.commodityId, marketId: p.marketId, marketDate: p.marketDate }, replacement: p, upsert: true },
  })),
);
console.log(`Loaded ${sampleData.commodities.length} commodities, ${sampleData.markets.length} markets, ${sampleData.prices.length} sample prices.`);
await disconnectMongo();

import { pino } from 'pino';
import { createApp } from './app';
import { loadConfig } from './config/env';
import { connectMongo, disconnectMongo } from './db/connect';
import { InMemoryMandiRepo } from './modules/mandi/inMemoryRepo';
import { MongoMandiRepo } from './modules/mandi/mongoRepo';
import { emptyData, sampleData } from './modules/mandi/seed';

const config = loadConfig();
const logger = pino({ level: config.logLevel, redact: ['req.headers.authorization', 'req.headers.cookie'] });

let mandiRepo;
if (config.mongoUri) {
  await connectMongo(config.mongoUri);
  mandiRepo = new MongoMandiRepo();
  logger.info('Connected to MongoDB');
} else {
  mandiRepo = new InMemoryMandiRepo(config.seedSampleMandi ? sampleData : emptyData);
  logger.warn({ sampleData: config.seedSampleMandi }, 'No MONGODB_URI set: using in-memory data (not persistent)');
}

const server = createApp({ config, logger, mandiRepo }).listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'Agrixore API listening');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    void disconnectMongo().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

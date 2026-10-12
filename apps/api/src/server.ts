import { fileURLToPath } from 'node:url';
import { pino } from 'pino';
import { createApp } from './app';
import { loadConfig } from './config/env';
import { connectMongo, disconnectMongo, ensureIndexes } from './db/connect';
import { hashPassword } from './lib/password';
import type { MandiAdminRepo } from './modules/admin/priceRepo';
import type { AdminUserRepo } from './modules/admin/userRepo';
import { InMemoryAdminUserRepo } from './modules/admin/userRepo.memory';
import { MongoAdminUserRepo } from './modules/admin/userRepo.mongo';
import { InMemoryMandiRepo } from './modules/mandi/inMemoryRepo';
import { MongoMandiRepo } from './modules/mandi/mongoRepo';
import type { MandiRepo } from './modules/mandi/repo';
import { emptyData, sampleData } from './modules/mandi/seed';

const config = loadConfig();
const logger = pino({ level: config.logLevel, redact: ['req.headers.authorization', 'req.headers.cookie'] });

let mandiRepo: MandiRepo & MandiAdminRepo;
let adminUsers: AdminUserRepo;
if (config.mongoUri) {
  await connectMongo(config.mongoUri);
  mandiRepo = new MongoMandiRepo();
  adminUsers = new MongoAdminUserRepo();
  await ensureIndexes();
  logger.info('Connected to MongoDB');
} else {
  mandiRepo = new InMemoryMandiRepo(config.seedSampleMandi ? sampleData : emptyData);
  const memoryUsers = new InMemoryAdminUserRepo();
  if (config.devAdmin) await memoryUsers.create({ email: config.devAdmin.email, passwordHash: await hashPassword(config.devAdmin.password) });
  adminUsers = memoryUsers;
  logger.warn({ sampleData: config.seedSampleMandi }, 'No MONGODB_URI set: using in-memory data (not persistent)');
}

// By default the API also serves the built admin dashboard (apps/admin/dist) when it exists.
const adminStaticDir = config.adminStaticDir ?? fileURLToPath(new URL('../../admin/dist', import.meta.url));
const admin = config.jwtSecret ? { users: adminUsers, prices: mandiRepo } : undefined;
if (admin) logger.info('Admin dashboard enabled at /admin/');
else logger.warn('Admin dashboard is off: set JWT_SECRET (32+ characters) to turn it on');

const server = createApp({ config: { ...config, adminStaticDir }, logger, mandiRepo, admin }).listen(config.port, () => {
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

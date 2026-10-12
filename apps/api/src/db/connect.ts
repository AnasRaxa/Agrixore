import mongoose from 'mongoose';

export async function connectMongo(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function mongoIsReady(): boolean {
  return mongoose.connection.readyState === 1;
}

/** Builds every model's indexes, including the ones that keep one price per commodity, market and day. */
export async function ensureIndexes(): Promise<void> {
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

import { db, type ScanRecord } from './db';

export const scanRepo = {
  add: (scan: ScanRecord) => db.scans.add(scan),
  get: (id: string) => db.scans.get(id),
  remove: (id: string) => db.scans.delete(id),
  clear: () => db.scans.clear(),
  listNewestFirst: () => db.scans.orderBy('createdAt').reverse().toArray(),
};

const MAX_FULL_IMAGES = 30;

/** Keep thumbnails forever but trim old full-size images so the phone does not fill up. */
export async function trimOldImages() {
  const all = await db.scans.orderBy('createdAt').reverse().toArray();
  const old = all.slice(MAX_FULL_IMAGES);
  await Promise.all(old.map((s) => db.scans.update(s.id, { image: s.thumbnail })));
}

import { toScanState, type CropChoice } from '@agrixore/shared';
import { db, type ScanRecord } from '../../db/db';
import { trimOldImages } from '../../db/scans';
import { decodeImage, resizeToBlob } from '../../lib/image';
import { classify } from '../../ml/classifier';

/**
 * Decode, downscale (this also strips EXIF/GPS), classify on-device and save to history.
 * The original photo is never stored. Returns the new scan id.
 */
export async function analyzeAndSave(file: File, crop: CropChoice): Promise<string> {
  const bitmap = await decodeImage(file);
  const image = await resizeToBlob(bitmap, 1024, 0.85);
  const thumbnail = await resizeToBlob(bitmap, 256, 0.8);
  const result = await classify(bitmap, crop, file.size);

  const top = result.predictions[0];
  const record: ScanRecord = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    crop,
    topClassId: top?.classId ?? 'unknown',
    confidence: top?.probability ?? 0,
    state: toScanState(top),
    predictions: result.predictions,
    modelVersion: result.modelVersion,
    engine: result.engine,
    thumbnail,
    image,
  };
  await db.scans.add(record);
  await trimOldImages();
  return record.id;
}

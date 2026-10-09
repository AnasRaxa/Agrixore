import type { CropChoice, Prediction } from '@agrixore/shared';
import { allContent } from './content';
import type { InferenceResult } from './types';

/**
 * DEMO ONLY. Used while no trained model is installed so every result screen can be previewed.
 * It does not look at the image. The UI always labels these results as a demo.
 */
export function demoClassify(crop: CropChoice, seed: number): InferenceResult {
  const pool = allContent.filter((c) => crop === 'unknown' || c.crop === crop);
  const disease = pool.find((c) => c.kind !== 'healthy') ?? pool[0];
  const healthy = pool.find((c) => c.kind === 'healthy' && c.crop === disease?.crop) ?? pool[0];
  const scenario = seed % 4;
  const pick = (c: typeof disease, probability: number): Prediction => ({ classId: c?.id ?? 'unknown', kind: c?.kind ?? 'disease', probability });
  const predictions: Prediction[] =
    scenario === 0 ? [pick(disease, 0.87), pick(healthy, 0.08)]
    : scenario === 1 ? [pick(disease, 0.64), pick(healthy, 0.22)]
    : scenario === 2 ? [pick(healthy, 0.91), pick(disease, 0.06)]
    : [pick(disease, 0.38), pick(healthy, 0.31)];
  return { engine: 'demo', modelVersion: 'demo', predictions, latencyMs: 0 };
}

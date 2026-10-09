import type { ClassKind, CropChoice, CropId, Prediction } from '@agrixore/shared';

export interface ClassInfo { index: number; id: string; crop: CropId | null; kind: ClassKind }

/** Mirrors ARCHITECTURE.md section 7.2. Class ids come from here, never hard-coded in the UI. */
export interface ModelManifest {
  version: string;
  architecture: string;
  modelFile?: string;
  input: { width: number; height: number; layout: 'CHW'; mean: number[]; std: number[] };
  temperature: number;
  classes: ClassInfo[];
}

export interface InferenceResult {
  engine: 'onnx' | 'demo';
  modelVersion: string;
  predictions: Prediction[];
  latencyMs: number;
}

export type WorkerRequest =
  | { id: number; type: 'init'; baseUrl: string; modelBase: string; manifest: ModelManifest }
  | { id: number; type: 'infer'; bitmap: ImageBitmap; crop: CropChoice };

export type WorkerResponse =
  | { id: number; ok: true; predictions?: Prediction[]; latencyMs?: number }
  | { id: number; ok: false; error: string };

/** A worker request before an id is attached (Omit does not distribute over unions, so this does). */
export type WorkerCall = WorkerRequest extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never;

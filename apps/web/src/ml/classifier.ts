import type { CropChoice } from '@agrixore/shared';
import { demoClassify } from './demo';
import type { InferenceResult, ModelManifest, WorkerCall, WorkerRequest, WorkerResponse } from './types';

const BASE = import.meta.env.BASE_URL;
const MODEL_BASE = `${BASE}models/v1/`;

type Engine = { kind: 'demo' } | { kind: 'onnx'; worker: Worker; manifest: ModelManifest };
let enginePromise: Promise<Engine> | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: WorkerResponse) => void }>();

function isManifest(value: unknown): value is ModelManifest {
  const m = value as ModelManifest;
  return !!m && Array.isArray(m.classes) && !!m.input && typeof m.version === 'string' && typeof m.temperature === 'number';
}

export async function readManifest(): Promise<ModelManifest | null> {
  try {
    const res = await fetch(`${MODEL_BASE}manifest.json`, { cache: 'no-cache' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
    const json: unknown = await res.json();
    return isManifest(json) ? json : null;
  } catch {
    return null;
  }
}

function call(worker: Worker, request: WorkerCall, transfer: Transferable[] = []): Promise<WorkerResponse> {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, { resolve });
    worker.postMessage({ ...request, id } as WorkerRequest, transfer);
  });
}

async function loadEngine(): Promise<Engine> {
  const manifest = await readManifest();
  if (!manifest) return { kind: 'demo' };
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    pending.get(event.data.id)?.resolve(event.data);
    pending.delete(event.data.id);
  };
  const res = await call(worker, { type: 'init', baseUrl: BASE, modelBase: MODEL_BASE, manifest });
  if (!res.ok) throw new Error(res.error);
  return { kind: 'onnx', worker, manifest };
}

export function getEngine(): Promise<Engine> {
  enginePromise ??= loadEngine().catch((error) => {
    enginePromise = null;
    throw error;
  });
  return enginePromise;
}

/** Classifies a decoded photo on-device. `seed` only matters in demo mode. */
export async function classify(bitmap: ImageBitmap, crop: CropChoice, seed: number): Promise<InferenceResult> {
  const engine = await getEngine();
  if (engine.kind === 'demo') {
    bitmap.close();
    return demoClassify(crop, seed);
  }
  const res = await call(engine.worker, { type: 'infer', bitmap, crop }, [bitmap]);
  if (!res.ok || !res.predictions) throw new Error(res.ok ? 'No predictions' : res.error);
  return { engine: 'onnx', modelVersion: engine.manifest.version, experimental: engine.manifest.experimental, predictions: res.predictions, latencyMs: res.latencyMs ?? 0 };
}

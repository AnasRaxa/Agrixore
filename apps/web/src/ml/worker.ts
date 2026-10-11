/// ONNX Runtime Web inference in a Web Worker (ARCHITECTURE.md section 7.1).
/// Single-threaded WASM on purpose: multi-threading needs cross-origin isolation headers.
import * as ort from 'onnxruntime-web/wasm';
import type { CropChoice, Prediction } from '@agrixore/shared';
import { cropToTensor, resizeBilinear, shorterSideSize } from './preprocess';
import type { ModelManifest, WorkerRequest, WorkerResponse } from './types';

const post = (message: WorkerResponse) => (self as unknown as { postMessage(m: WorkerResponse): void }).postMessage(message);

let session: ort.InferenceSession | null = null;
let manifest: ModelManifest | null = null;

async function init(baseUrl: string, modelBase: string, m: ModelManifest) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = `${baseUrl}ort/`;
  manifest = m;
  session = await ort.InferenceSession.create(`${modelBase}${m.modelFile ?? 'model.onnx'}`, { executionProviders: ['wasm'] });
}

/** Largest shorter side handed to the exact resize. Bigger photos are first shrunk by the browser (cheap, smooth). */
const EXACT_RESIZE_CAP = 1024;

function toTensor(bitmap: ImageBitmap, m: ModelManifest): ort.Tensor {
  const { width, height, mean, std, resizeShorterSide } = m.input;
  let chw: Float32Array;
  if (resizeShorterSide) {
    // Same pipeline as training: Resize(shorter side) then CenterCrop, with Pillow-compatible resampling.
    const shrink = Math.min(1, EXACT_RESIZE_CAP / Math.min(bitmap.width, bitmap.height));
    const sw = Math.max(1, Math.round(bitmap.width * shrink));
    const sh = Math.max(1, Math.round(bitmap.height * shrink));
    const canvas = new OffscreenCanvas(sw, sh);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('OffscreenCanvas is not available');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, sw, sh);
    const target = shorterSideSize(bitmap.width, bitmap.height, resizeShorterSide);
    const resized = resizeBilinear(ctx.getImageData(0, 0, sw, sh).data, sw, sh, target.width, target.height);
    chw = cropToTensor(resized, target.width, target.height, width, height, mean, std);
  } else {
    // No resize rule in the manifest: squash the whole photo to the model size.
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('OffscreenCanvas is not available');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    const plane = width * height;
    chw = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) for (let c = 0; c < 3; c++) chw[c * plane + i] = (data[i * 4 + c] / 255 - mean[c]) / std[c];
  }
  return new ort.Tensor('float32', chw, [1, 3, height, width]);
}

/** Temperature-scaled softmax over the classes allowed for the chosen crop (+ the not-a-leaf class). */
function postprocess(logits: Float32Array, m: ModelManifest, crop: CropChoice): Prediction[] {
  const allowed = m.classes.filter((c) => crop === 'unknown' || c.crop === crop || c.kind === 'negative');
  const scaled = allowed.map((c) => logits[c.index] / m.temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return allowed
    .map((c, i) => ({ classId: c.id, kind: c.kind, probability: exps[i] / sum }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === 'init') {
      await init(req.baseUrl, req.modelBase, req.manifest);
      post({ id: req.id, ok: true });
      return;
    }
    if (!session || !manifest) throw new Error('Model is not loaded');
    const started = performance.now();
    const input = toTensor(req.bitmap, manifest);
    req.bitmap.close();
    const outputs = await session.run({ [session.inputNames[0]]: input });
    const logits = outputs[session.outputNames[0]].data as Float32Array;
    post({ id: req.id, ok: true, predictions: postprocess(logits, manifest, req.crop), latencyMs: Math.round(performance.now() - started) });
  } catch (error) {
    post({ id: req.id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};

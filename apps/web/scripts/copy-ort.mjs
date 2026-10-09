// Copies the self-hosted ONNX Runtime Web WASM files into public/ort (git-ignored).
// The service worker precaches them so on-device inference works offline.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const distDir = fileURLToPath(new URL('../node_modules/onnxruntime-web/dist/', import.meta.url));
const outDir = fileURLToPath(new URL('../public/ort/', import.meta.url));
mkdirSync(outDir, { recursive: true });
for (const file of ['ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs']) {
  const from = join(distDir, file);
  if (!existsSync(from)) { console.error(`copy-ort: missing ${from}. Check the onnxruntime-web version.`); process.exit(1); }
  copyFileSync(from, join(outDir, file));
}
console.log('copy-ort: ONNX Runtime WASM files copied to public/ort');

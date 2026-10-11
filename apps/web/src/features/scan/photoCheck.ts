/**
 * Cheap, deterministic "is this even a photo of a plant?" check that runs BEFORE the model.
 * The disease model only knows 13 classes and has no "not a leaf" class yet, so on its own it will label a black
 * or empty picture as a disease with high confidence. This catches obviously unusable photos (dark, blank, noise,
 * no vegetation colours). It does NOT detect green non-leaf objects (grass, a green shirt). The proper fix is a
 * trained not_a_leaf class (see ml/README.md). All thresholds are starting points, not tuned values.
 */
export type PhotoProblem = 'tooDark' | 'tooBright' | 'blank' | 'noisy' | 'noPlant';

export interface PhotoStats {
  meanLuma: number; // 0..255
  stdLuma: number; // 0..255, spread of brightness
  roughness: number; // mean brightness jump between neighbouring pixels (noise is high, real photos are low)
  plantFraction: number; // 0..1, share of pixels with green/yellow-green vegetation colour
}

export const PHOTO_THRESHOLDS = {
  minMeanLuma: 25,
  maxMeanLuma: 235,
  minStdLuma: 10,
  maxRoughness: 32,
  minPlantFraction: 0.1,
} as const;

/** Hue in degrees (0..360) of an RGB pixel, with saturation and value in 0..1. */
function hsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max / 255 };
}

/** `rgba` is a small downscaled copy of the photo (for example 64x64) in canvas ImageData layout. */
export function measurePhoto(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): PhotoStats {
  const n = width * height;
  const luma = new Float32Array(n);
  let sum = 0;
  let plant = 0;
  for (let i = 0; i < n; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[i] = y;
    sum += y;
    const { h, s, v } = hsv(r, g, b);
    if (h >= 40 && h <= 170 && s >= 0.18 && v >= 0.2) plant++;
  }
  const mean = sum / n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (luma[i] - mean) ** 2;
  let jump = 0;
  let pairs = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      jump += Math.abs(luma[y * width + x] - luma[y * width + x + 1]);
      pairs++;
    }
  }
  return { meanLuma: mean, stdLuma: Math.sqrt(variance / n), roughness: pairs ? jump / pairs : 0, plantFraction: plant / n };
}

/** Returns why the photo should be retaken, or null when it looks usable. */
export function checkPhoto(stats: PhotoStats): PhotoProblem | null {
  const t = PHOTO_THRESHOLDS;
  if (stats.meanLuma < t.minMeanLuma) return 'tooDark';
  if (stats.meanLuma > t.maxMeanLuma) return 'tooBright';
  if (stats.stdLuma < t.minStdLuma) return 'blank';
  if (stats.roughness > t.maxRoughness) return 'noisy';
  if (stats.plantFraction < t.minPlantFraction) return 'noPlant';
  return null;
}

export class PhotoRejectedError extends Error {
  readonly problem: PhotoProblem;
  constructor(problem: PhotoProblem) {
    super(`Photo rejected: ${problem}`);
    this.problem = problem;
  }
}

/** Downscales the decoded photo to 64x64 and runs the check. */
export function inspectBitmap(bitmap: ImageBitmap): PhotoProblem | null {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null; // cannot inspect: let the model decide
  ctx.drawImage(bitmap, 0, 0, size, size);
  return checkPhoto(measurePhoto(ctx.getImageData(0, 0, size, size).data, size, size));
}

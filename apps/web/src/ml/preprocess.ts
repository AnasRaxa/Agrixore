/**
 * Image preprocessing that mirrors training (torchvision Resize(256) + CenterCrop(224) on PIL images).
 * The browser's own canvas scaler resamples differently from Pillow, which shifts the model's probabilities,
 * so the resize is implemented here instead. Pure functions: no DOM, easy to test against Pillow output.
 */

/** Python's round(): halves go to the nearest even number (torchvision's CenterCrop uses it). */
export function roundHalfEven(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/** torchvision Resize(size) for an int size: the shorter side becomes `size`, the longer side is truncated. */
export function shorterSideSize(width: number, height: number, size: number): { width: number; height: number } {
  return width <= height
    ? { width: size, height: Math.trunc((size * height) / width) }
    : { width: Math.trunc((size * width) / height), height: size };
}

interface Taps { starts: Int32Array; counts: Int32Array; weights: Float32Array[] }

/** Pillow's BILINEAR: a triangle filter whose width grows with the downscale factor (that is the antialiasing). */
function taps(inSize: number, outSize: number): Taps {
  const scale = inSize / outSize;
  const filterScale = Math.max(scale, 1);
  const support = filterScale;
  const starts = new Int32Array(outSize);
  const counts = new Int32Array(outSize);
  const weights: Float32Array[] = [];
  for (let i = 0; i < outSize; i++) {
    const center = (i + 0.5) * scale;
    const xmin = Math.max(0, Math.trunc(center - support + 0.5));
    const xmax = Math.min(inSize, Math.trunc(center + support + 0.5));
    const n = xmax - xmin;
    const w = new Float32Array(n);
    let sum = 0;
    for (let x = 0; x < n; x++) {
      const arg = Math.abs((x + xmin - center + 0.5) / filterScale);
      w[x] = arg < 1 ? 1 - arg : 0;
      sum += w[x];
    }
    if (sum !== 0) for (let x = 0; x < n; x++) w[x] /= sum;
    starts[i] = xmin;
    counts[i] = n;
    weights.push(w);
  }
  return { starts, counts, weights };
}

const clamp8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** RGBA pixels in, interleaved RGB out, rounded to whole 0..255 values like Pillow's 8-bit result. */
export function resizeBilinear(rgba: Uint8ClampedArray | Uint8Array, sw: number, sh: number, dw: number, dh: number): Float32Array {
  const hx = taps(sw, dw);
  const vy = taps(sh, dh);
  // Horizontal pass: sh rows x dw columns
  const mid = new Float32Array(sh * dw * 3);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < dw; x++) {
      const w = hx.weights[x];
      const start = hx.starts[x];
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < hx.counts[x]; k++) {
        const p = (y * sw + start + k) * 4;
        r += rgba[p] * w[k];
        g += rgba[p + 1] * w[k];
        b += rgba[p + 2] * w[k];
      }
      const o = (y * dw + x) * 3;
      mid[o] = clamp8(r);
      mid[o + 1] = clamp8(g);
      mid[o + 2] = clamp8(b);
    }
  }
  // Vertical pass: dh rows x dw columns
  const out = new Float32Array(dh * dw * 3);
  for (let y = 0; y < dh; y++) {
    const w = vy.weights[y];
    const start = vy.starts[y];
    for (let x = 0; x < dw; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < vy.counts[y]; k++) {
        const p = ((start + k) * dw + x) * 3;
        r += mid[p] * w[k];
        g += mid[p + 1] * w[k];
        b += mid[p + 2] * w[k];
      }
      const o = (y * dw + x) * 3;
      out[o] = clamp8(r);
      out[o + 1] = clamp8(g);
      out[o + 2] = clamp8(b);
    }
  }
  return out;
}

/** Center-crops interleaved RGB and returns normalised planar CHW floats ready for the model. */
export function cropToTensor(rgb: Float32Array, rw: number, rh: number, cw: number, ch: number, mean: number[], std: number[]): Float32Array {
  const left = roundHalfEven((rw - cw) / 2);
  const top = roundHalfEven((rh - ch) / 2);
  const plane = cw * ch;
  const out = new Float32Array(3 * plane);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const src = ((top + y) * rw + left + x) * 3;
      for (let c = 0; c < 3; c++) out[c * plane + y * cw + x] = (rgb[src + c] / 255 - mean[c]) / std[c];
    }
  }
  return out;
}

import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/pillow-resize.json';
import { cropToTensor, resizeBilinear, roundHalfEven, shorterSideSize } from './preprocess';

describe('resizeBilinear matches Pillow', () => {
  // Expected values were produced by PIL.Image.resize(..., Image.BILINEAR) on seeded random images.
  for (const c of fixture) {
    it(`${c.sw}x${c.sh} -> ${c.dw}x${c.dh}`, () => {
      const out = resizeBilinear(Uint8Array.from(c.src), c.sw, c.sh, c.dw, c.dh);
      const worst = Math.max(...Array.from(out, (v, i) => Math.abs(v - c.expected[i])));
      expect(worst).toBeLessThanOrEqual(1); // Pillow uses fixed-point maths, so +-1 is allowed
    });
  }
});

describe('torchvision-style sizing', () => {
  it('truncates the longer side like Resize(256)', () => {
    expect(shorterSideSize(900, 1200, 256)).toEqual({ width: 256, height: 341 });
    expect(shorterSideSize(1600, 1200, 256)).toEqual({ width: 341, height: 256 });
    expect(shorterSideSize(500, 500, 256)).toEqual({ width: 256, height: 256 });
  });
  it('rounds halves to even like Python round()', () => {
    expect([58.5, 59.5, 16, 15.5, 0.4].map(roundHalfEven)).toEqual([58, 60, 16, 16, 0]);
  });
});

describe('cropToTensor', () => {
  it('center-crops and normalises into planar CHW', () => {
    const rgb = Float32Array.from({ length: 4 * 4 * 3 }, (_, i) => (i % 3 === 0 ? 255 : 0)); // pure red image
    const t = cropToTensor(rgb, 4, 4, 2, 2, [0, 0, 0], [1, 1, 1]);
    expect(Array.from(t.slice(0, 4))).toEqual([1, 1, 1, 1]); // red plane
    expect(Array.from(t.slice(4))).toEqual(new Array(8).fill(0)); // green + blue planes
  });
});

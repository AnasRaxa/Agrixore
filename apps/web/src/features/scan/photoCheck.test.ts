import { describe, expect, it } from 'vitest';
import { checkPhoto, measurePhoto } from './photoCheck';

const W = 64;
type Pixel = (x: number, y: number) => [number, number, number];
function image(pixel: Pixel): Uint8ClampedArray {
  const out = new Uint8ClampedArray(W * W * 4);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = pixel(x, y);
      out.set([r, g, b, 255], (y * W + x) * 4);
    }
  }
  return out;
}
const verdict = (px: Pixel) => checkPhoto(measurePhoto(image(px), W, W));

// deterministic pseudo-random numbers so the tests never flake
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// Synthetic stand-ins for real photos: a lit green leaf with a few brown spots, and a yellow-striped leaf.
const leaf: Pixel = (x, y) => {
  const light = 60 + x * 1.2; // lighting falls off across the frame
  const spot = (x - 20) ** 2 + (y - 30) ** 2 < 30 || (x - 45) ** 2 + (y - 15) ** 2 < 20;
  return spot ? [120, 80, 40] : [light * 0.5, light * 1.1, light * 0.4];
};

describe('checkPhoto', () => {
  it('accepts a green leaf with brown spots', () => expect(verdict(leaf)).toBeNull());
  it('accepts a yellow-striped (rust-like) leaf', () =>
    expect(verdict((x, y) => (Math.floor(x / 5) % 2 ? [200, 190, 60] : [90, 140, 60 + y / 2]))).toBeNull());
  it('rejects a black photo', () => expect(verdict(() => [0, 0, 0])).toBe('tooDark'));
  it('rejects a washed-out white photo', () => expect(verdict(() => [250, 250, 250])).toBe('tooBright'));
  it('rejects a flat gray photo', () => expect(verdict(() => [128, 128, 128])).toBe('blank'));
  it('rejects a flat green photo (nothing to look at)', () => expect(verdict(() => [60, 140, 60])).toBe('blank'));
  it('rejects random noise', () => expect(verdict(() => [rand() * 255, rand() * 255, rand() * 255])).toBe('noisy'));
  it('rejects a blue sky gradient', () => expect(verdict((x) => [90 + x, 150 + x, 255])).toBe('noPlant'));
  // Reddish-brown soil. Sandy or straw-yellow ground has the same hue as yellowing leaves and cannot be told apart by colour alone.
  it('rejects textured reddish-brown soil', () => {
    const grain = () => (rand() - 0.5) * 60; // brightness grain: lighter and darker soil, same colour
    expect(verdict((x, y) => { const n = grain(); return [120 + x / 2 + n, 70 + y / 4 + n, 40 + n]; })).toBe('noPlant');
  });
  it('rejects skin-coloured picture', () => expect(verdict((x, y) => [220 - y, 170 - y, 140 + x / 4])).toBe('noPlant'));
});

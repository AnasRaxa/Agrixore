export const CROPS = ['maize', 'wheat', 'cotton'] as const;
export type CropId = (typeof CROPS)[number];
/** A crop picked on the scan screen. "unknown" means "Not sure". */
export type CropChoice = CropId | 'unknown';

export const SUPPORTED_LANGS = ['ur', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

/** TODO(owner): calibrate on a validation set before trusting these numbers. */
export const CONFIDENCE_THRESHOLDS = { confident: 0.8, possible: 0.5 } as const;

/** TODO(owner): review all alert thresholds with an agronomist / official guidance. */
export const ALERT_THRESHOLDS = {
  heavyRainMm: 30,
  frostMinC: 2,
  heatwaveMaxC: 40,
} as const;

/** TODO(owner): review irrigation rules with an agronomist. */
export const IRRIGATION_THRESHOLDS = {
  skipRainProbabilityPct: 60,
  skipRainMm: 5,
  hotMaxC: 38,
} as const;

/** Cached data older than this is shown with a "may be out of date" warning. */
export const STALE_AFTER_HOURS = 24;

/** Local units. TODO(owner): confirm regional standards. */
export const UNITS = {
  kgPerMaund: 40,
  sqFtPerAcre: 43_560,
  kanalPerAcre: 8,
  marlaPerKanal: 20,
  sqFtPerMarla: 272.25,
} as const;

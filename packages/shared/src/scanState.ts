import { CONFIDENCE_THRESHOLDS } from './constants';
import type { Prediction, ScanState } from './types';

/** Maps the top prediction to the result state shown to the farmer (PRODUCT.md F-DD-05). */
export function toScanState(top: Prediction | undefined): ScanState {
  if (!top) return 'error';
  const { confident, possible } = CONFIDENCE_THRESHOLDS;
  if (top.probability < possible) return 'unsure';
  if (top.kind === 'negative') return 'not_a_leaf';
  if (top.kind === 'healthy') return 'healthy';
  return top.probability >= confident ? 'confident' : 'possible';
}

import type { CropId } from './constants';

export type ClassKind = 'disease' | 'pest' | 'virus' | 'healthy' | 'negative';
export type ScanState = 'confident' | 'possible' | 'unsure' | 'healthy' | 'not_a_leaf' | 'error';

export interface Prediction {
  classId: string;
  probability: number;
  kind: ClassKind;
}

export type Lang2 = { en: string; ur: string };
export type LangList = { en: string[]; ur: string[] };

export interface ChemicalOption {
  /** Generic active ingredient or group. Never a brand name. */
  activeIngredient: string;
  note: Lang2;
  /** Only allowed when reviewStatus is "reviewed". */
  dosage?: Lang2;
  preHarvestIntervalDays?: number;
}

export interface DiseaseContent {
  id: string;
  crop: CropId;
  kind: Exclude<ClassKind, 'negative'>;
  name: Lang2;
  summary: Lang2;
  symptoms: LangList;
  spread: Lang2;
  prevention: LangList;
  treatment: {
    cultural: LangList;
    organic: LangList;
    chemical: ChemicalOption[];
  };
  safety: LangList;
  whenToCallExpert: Lang2;
  reviewStatus: 'draft' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: string;
  sources: Array<{ title: string; url?: string }>;
  version: number;
}

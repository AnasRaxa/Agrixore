import { create } from 'zustand';
import type { CropChoice, CropId, Lang } from '@agrixore/shared';
import { db } from './db';
import { i18n } from '../i18n';

export interface Place { id: string; name: { en: string; ur: string }; lat: number; lon: number; source: 'list' | 'gps' }

export interface Settings {
  language: Lang;
  crops: CropId[];
  place: Place | null;
  textSize: 'normal' | 'large' | 'xl';
  theme: 'light' | 'sunlight';
  onboardingDone: boolean;
  deviceId: string;
  /** Crop used on the last scan; the scan screen starts with it. */
  lastCrop: CropChoice | null;
  installDismissed: boolean;
}

function defaultSettings(): Settings {
  return {
    language: navigator.language.toLowerCase().startsWith('ur') ? 'ur' : 'en',
    crops: [],
    place: null,
    textSize: 'normal',
    theme: 'light',
    onboardingDone: false,
    deviceId: crypto.randomUUID(),
    lastCrop: null,
    installDismissed: false,
  };
}

export function applyDocumentSettings(s: Pick<Settings, 'language' | 'textSize' | 'theme'>) {
  const root = document.documentElement;
  root.lang = s.language;
  root.dir = s.language === 'ur' ? 'rtl' : 'ltr';
  root.dataset.theme = s.theme;
  root.dataset.textSize = s.textSize;
}

interface SettingsStore extends Settings {
  ready: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  ...defaultSettings(),
  ready: false,
  async load() {
    const stored = Object.fromEntries((await db.settings.toArray()).map((r) => [r.key, r.value]));
    const merged = { ...defaultSettings(), ...stored } as Settings;
    set({ ...merged, ready: true });
    if (!stored.deviceId) await db.settings.put({ key: 'deviceId', value: merged.deviceId });
    applyDocumentSettings(merged);
  },
  async update(patch) {
    set(patch);
    const next = get();
    applyDocumentSettings(next);
    if (patch.language) await i18n.changeLanguage(patch.language);
    await db.settings.bulkPut(Object.entries(patch).map(([key, value]) => ({ key, value })));
  },
}));

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocateFixed } from 'lucide-react';
import { Button } from './Button';
import { Notice } from './Notice';
import { PLACES, gpsPlace } from '../lib/locations';
import { useSettings, type Place } from '../db/settings';

export function PlacePicker({ value, onChange }: { value: Place | null; onChange: (place: Place) => void }) {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.language);
  const [state, setState] = useState<'idle' | 'locating' | 'failed'>('idle');

  function locateMe() {
    if (!('geolocation' in navigator)) { setState('failed'); return; }
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setState('idle'); onChange(gpsPlace(pos.coords.latitude, pos.coords.longitude)); },
      () => setState('failed'),
      { enableHighAccuracy: false, timeout: 15_000 },
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="soft" className="w-full" onClick={locateMe} disabled={state === 'locating'}>
        <LocateFixed aria-hidden="true" className="size-5" />
        {state === 'locating' ? t('onboarding.locating') : t('onboarding.useGps')}
      </Button>
      {state === 'failed' && <Notice tone="warn">{t('onboarding.gpsFailed')}</Notice>}
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t('onboarding.pickPlace')}</span>
        <select
          className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base"
          value={value?.source === 'list' ? value.id : ''}
          onChange={(e) => {
            const p = PLACES.find((x) => x.id === e.target.value);
            if (p) onChange({ ...p, source: 'list' });
          }}
        >
          <option value="" disabled>{t('onboarding.placeholder')}</option>
          {PLACES.map((p) => <option key={p.id} value={p.id}>{p.name[lang]}</option>)}
        </select>
      </label>
      {value?.source === 'gps' && <p className="text-sm text-muted">{value.name[lang]}</p>}
    </div>
  );
}

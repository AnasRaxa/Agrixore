import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CROPS, type CropId, type Lang } from '@agrixore/shared';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Notice } from '../../components/Notice';
import { PlacePicker } from '../../components/PlacePicker';
import { db } from '../../db/db';
import { scanRepo } from '../../db/scans';
import { useSettings, type Settings } from '../../db/settings';
import { readManifest } from '../../ml/classifier';

const APP_VERSION = '0.1.0';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-canopy">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const s = useSettings();
  const [modelVersion, setModelVersion] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void readManifest().then((m) => { if (active) setModelVersion(m ? m.version : null); });
    return () => { active = false; };
  }, []);

  const toggleCrop = (c: CropId) => void s.update({ crops: s.crops.includes(c) ? s.crops.filter((x) => x !== c) : [...s.crops, c] });

  async function clearAll() {
    if (!window.confirm(t('settings.confirmClearAll'))) return;
    await Promise.all([db.scans.clear(), db.weatherCache.clear(), db.priceCache.clear(), db.priceTargets.clear()]);
  }

  return (
    <div className="space-y-7 pt-2">
      <h1 className="text-2xl font-bold text-canopy">{t('settings.title')}</h1>

      <Group title={t('settings.language')}>
        <div className="flex gap-2">
          {([['ur', 'اردو'], ['en', 'English']] as Array<[Lang, string]>).map(([code, label]) => (
            <Chip key={code} lang={code} selected={s.language === code} onClick={() => void s.update({ language: code })}>{label}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t('settings.crops')}>
        <div className="flex flex-wrap gap-2">
          {CROPS.map((c) => <Chip key={c} selected={s.crops.includes(c)} onClick={() => toggleCrop(c)}>{t(`crops.${c}`)}</Chip>)}
        </div>
      </Group>

      <Group title={t('settings.location')}>
        <PlacePicker value={s.place} onChange={(place) => void s.update({ place })} />
      </Group>

      <Group title={t('settings.textSize')}>
        <div className="flex flex-wrap gap-2">
          {(['normal', 'large', 'xl'] as Array<Settings['textSize']>).map((size) => (
            <Chip key={size} selected={s.textSize === size} onClick={() => void s.update({ textSize: size })}>{t(`settings.size.${size}`)}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t('settings.theme')}>
        <div className="flex flex-wrap gap-2">
          {(['light', 'sunlight'] as Array<Settings['theme']>).map((theme) => (
            <Chip key={theme} selected={s.theme === theme} onClick={() => void s.update({ theme })}>{t(`settings.themeOption.${theme}`)}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t('settings.data')}>
        <div className="grid gap-3">
          <Button variant="soft" onClick={() => { if (window.confirm(t('settings.confirmClearHistory'))) void scanRepo.clear(); }}>{t('settings.clearHistory')}</Button>
          <Button variant="danger" onClick={() => void clearAll()}>{t('settings.clearAll')}</Button>
        </div>
      </Group>

      <Group title={t('settings.about')}>
        <div className="space-y-1 text-[0.95rem]">
          <p>{t('app.name')} · {t('settings.version', { version: APP_VERSION })}</p>
          <p>{t('settings.model')}: {modelVersion === undefined ? t('common.loading') : modelVersion ? t('settings.modelInstalled', { version: modelVersion }) : t('settings.modelDemo')}</p>
          <p className="text-muted">{t('settings.weatherCredit')}</p>
        </div>
        <Notice>{t('settings.disclaimer')}</Notice>
      </Group>
    </div>
  );
}

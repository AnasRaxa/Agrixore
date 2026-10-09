import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { CROPS, type CropId, type Lang } from '@agrixore/shared';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Logo } from '../../components/Logo';
import { PlacePicker } from '../../components/PlacePicker';
import { useSettings, type Place } from '../../db/settings';

const TOTAL = 3;

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const settings = useSettings();
  const [step, setStep] = useState(0);
  const [crops, setCrops] = useState<CropId[]>(settings.crops);
  const [place, setPlace] = useState<Place | null>(settings.place);

  const chooseLanguage = (language: Lang) => { void settings.update({ language }); setStep(1); };
  const toggleCrop = (c: CropId) => setCrops((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const finish = async () => {
    await settings.update({ crops, place, onboardingDone: true });
    navigate('/', { replace: true });
  };

  return (
    <div className="app-frame safe-top safe-bottom flex flex-col px-5 pb-6 pt-8">
      <div className="flex items-center justify-between">
        <Logo className="size-11" />
        <p className="text-sm text-muted">{t('onboarding.step', { n: step + 1, total: TOTAL })}</p>
      </div>

      <div className="mt-10 flex-1">
        {step === 0 && (
          <section>
            <h1 className="text-2xl font-bold text-canopy">{t('onboarding.languageTitle')}</h1>
            <div className="mt-6 grid gap-3">
              {([['ur', 'اردو'], ['en', 'English']] as const).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  onClick={() => chooseLanguage(code)}
                  className="flex min-h-20 items-center justify-between rounded-3xl border border-line bg-surface px-6 text-2xl font-semibold text-canopy active:scale-[0.99]"
                >
                  {label}
                  {settings.language === code && <Check aria-hidden="true" className="size-6 text-leaf" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="text-2xl font-bold text-canopy">{t('onboarding.cropsTitle')}</h1>
            <p className="mt-1 text-muted">{t('onboarding.cropsHint')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {CROPS.map((c) => (
                <Chip key={c} selected={crops.includes(c)} onClick={() => toggleCrop(c)} className="min-h-14 px-6 text-lg">
                  {crops.includes(c) && <Check aria-hidden="true" className="size-5" />}
                  {t(`crops.${c}`)}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-2xl font-bold text-canopy">{t('onboarding.locationTitle')}</h1>
            <p className="mt-1 text-muted">{t('onboarding.locationHint')}</p>
            <div className="mt-6"><PlacePicker value={place} onChange={setPlace} /></div>
          </section>
        )}
      </div>

      {step > 0 && (
        <div className="mt-8 flex gap-3">
          <Button variant="ghost" onClick={() => (step === 2 ? void finish() : setStep(step + 1))}>{t('common.skip')}</Button>
          <Button className="flex-1" onClick={() => (step === 2 ? void finish() : setStep(step + 1))}>
            {step === 2 ? t('common.finish') : t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Hand, Image as ImageIcon, Maximize, Sun } from 'lucide-react';
import { CROPS, type CropChoice } from '@agrixore/shared';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Notice } from '../../components/Notice';
import { Viewfinder } from '../../components/Viewfinder';
import { useSettings } from '../../db/settings';
import { analyzeAndSave } from './analyze';

export function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const myCrops = useSettings((s) => s.crops);
  const [crop, setCrop] = useState<CropChoice>(myCrops[0] ?? 'unknown');
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFailed(false);
    setPreview(URL.createObjectURL(file));
    try {
      const id = await analyzeAndSave(file, crop);
      navigate(`/result/${id}`);
    } catch {
      setFailed(true);
      setPreview(null);
    }
  }

  const choices: CropChoice[] = [...CROPS, 'unknown'];
  const tips = [
    { Icon: Sun, text: t('scan.tip1') },
    { Icon: Maximize, text: t('scan.tip2') },
    { Icon: Hand, text: t('scan.tip3') },
  ];

  if (preview) {
    return (
      <section className="space-y-4 pt-2" aria-live="polite">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-tint">
          <img src={preview} alt="" className="size-full object-cover" />
          <div className="scan-line absolute inset-x-0 h-0.5 bg-sprout shadow-[0_0_14px_2px_var(--sprout)]" />
          <Viewfinder className="absolute inset-4 text-white" />
        </div>
        <p className="text-center text-lg font-semibold text-canopy">{t('scan.analyzing')}</p>
        <p className="text-center text-sm text-muted">{t('scan.analyzingHint')}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 pt-2">
      <h1 className="text-2xl font-bold text-canopy">{t('scan.title')}</h1>

      <div>
        <p className="mb-2 font-semibold">{t('scan.cropLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {choices.map((c) => (
            <Chip key={c} selected={crop === c} onClick={() => setCrop(c)}>{t(`crops.${c}`)}</Chip>
          ))}
        </div>
      </div>

      <Viewfinder className="aspect-[4/3] w-full rounded-3xl bg-tint text-leaf">
        <ul className="space-y-3 p-8">
          <li className="mb-1 font-semibold text-canopy">{t('scan.tipsTitle')}</li>
          {tips.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-[0.95rem] text-ink">
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-leaf" />
              {text}
            </li>
          ))}
        </ul>
      </Viewfinder>

      {failed && <Notice tone="danger">{t('scan.failed')}</Notice>}

      <div className="grid gap-3">
        <Button className="min-h-14 text-lg" onClick={() => cameraInput.current?.click()}>
          <Camera aria-hidden="true" className="size-6" />
          {t('scan.takePhoto')}
        </Button>
        <Button variant="soft" onClick={() => galleryInput.current?.click()}>
          <ImageIcon aria-hidden="true" className="size-5" />
          {t('scan.fromGallery')}
        </Button>
      </div>

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }} />
    </section>
  );
}

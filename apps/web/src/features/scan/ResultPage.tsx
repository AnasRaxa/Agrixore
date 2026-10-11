import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, FlaskConical, Share2, ScanLine, Trash2, TriangleAlert, Info, CircleHelp } from 'lucide-react';
import type { DiseaseContent, ScanState } from '@agrixore/shared';
import { Button, buttonClass } from '../../components/Button';
import { BlobImage } from '../../components/BlobImage';
import { Notice } from '../../components/Notice';
import { Section } from '../../components/Section';
import { Viewfinder } from '../../components/Viewfinder';
import { scanRepo } from '../../db/scans';
import { useSettings } from '../../db/settings';
import { shareText } from '../../lib/share';
import { getContent } from '../../ml/content';
import { cn } from '../../lib/cn';
import { scanHeadline } from './describe';

const STATE_TONE: Record<ScanState, string> = {
  confident: 'bg-leaf text-white',
  healthy: 'bg-leaf text-white',
  possible: 'bg-grain-tint text-grain',
  unsure: 'bg-grain-tint text-grain',
  not_a_leaf: 'bg-tint text-canopy',
  error: 'bg-clay-tint text-clay',
};

export function ResultPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = useSettings((s) => s.language);
  const loaded = useLiveQuery(async () => ({ scan: await scanRepo.get(id) }), [id]);

  if (!loaded) return <p role="status" className="py-10 text-center text-muted">{t('common.loading')}</p>;
  const scan = loaded.scan;
  if (!scan) {
    return (
      <section className="space-y-4 py-10 text-center">
        <p>{t('result.notFound')}</p>
        <Link to="/scan" className={buttonClass('primary')}>{t('result.scanAgain')}</Link>
      </section>
    );
  }

  const content: DiseaseContent | undefined = getContent(scan.topClassId);
  const headline = scanHeadline(scan.state, scan.topClassId, lang, t);
  const percent = Math.round(scan.confidence * 100);
  const showReport = (scan.state === 'confident' || scan.state === 'possible' || scan.state === 'healthy') && content;
  const reviewed = content?.reviewStatus === 'reviewed';
  const helpKey = `result.help.${scan.state}`;
  const hasHelp = ['possible', 'unsure', 'not_a_leaf', 'error'].includes(scan.state);

  async function remove() {
    if (!window.confirm(t('result.confirmDelete'))) return;
    await scanRepo.remove(scan?.id ?? id);
    navigate('/history', { replace: true });
  }

  const actions = (
      <div className="grid gap-3 pt-1 sm:grid-cols-3 lg:grid-cols-1">
        <Button
          onClick={() =>
            void shareText(t('result.shareText', { crop: t(`crops.${scan.crop}`), headline, percent }))
          }
        >
          <Share2 aria-hidden="true" className="size-5" />
          {t('result.share')}
        </Button>
        <Link to="/scan" className={buttonClass('soft')}>
          <ScanLine aria-hidden="true" className="size-5" />
          {t('result.scanAgain')}
        </Link>
        <Button variant="danger" onClick={() => void remove()}>
          <Trash2 aria-hidden="true" className="size-5" />
          {t('result.delete')}
        </Button>
      </div>
  );

  return (
    <article className="grid gap-4 pt-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10 lg:pt-0">
      <div className="space-y-4 lg:sticky lg:top-8">
      <div className="relative overflow-hidden rounded-3xl bg-tint">
        <BlobImage blob={scan.image} alt="" className="aspect-[4/3] w-full object-cover" />
        <Viewfinder className="absolute inset-4 text-white/90" />
      </div>

      {scan.engine === 'onnx' && scan.experimental && (
        <Notice tone="warn" icon={<FlaskConical aria-hidden="true" className="size-5" />} title={t('result.experimentalTitle')}>
          {t('result.experimentalBody')}
        </Notice>
      )}

      {scan.engine === 'demo' && (
        <Notice tone="warn" icon={<FlaskConical aria-hidden="true" className="size-5" />} title={t('result.demoTitle')}>
          {t('result.demoBody')}
        </Notice>
      )}

      <header className="space-y-3">
        <h1 className="text-2xl font-bold leading-snug text-canopy lg:text-3xl">{headline}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t(`crops.${scan.crop}`)}</span>
          {scan.state !== 'not_a_leaf' && scan.state !== 'error' && (
            <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', STATE_TONE[scan.state])}>{t('result.confidence', { percent })}</span>
          )}
        </div>
        {scan.state !== 'not_a_leaf' && scan.state !== 'error' && (
          <div className="h-2 overflow-hidden rounded-full bg-tint" role="presentation">
            <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
          </div>
        )}
        {hasHelp && <p className="text-muted">{t(helpKey)}</p>}
      </header>
      <div className="hidden lg:block">{actions}</div>
      </div>

      <div className="space-y-4">

      {showReport && content && (
        <>
          <p className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold', reviewed ? 'bg-tint text-canopy' : 'bg-grain-tint text-grain')}>
            {reviewed ? <BadgeCheck aria-hidden="true" className="size-4" /> : <CircleHelp aria-hidden="true" className="size-4" />}
            {reviewed ? t('result.reviewed') : t('result.draft')}
          </p>

          <div className="space-y-3">
            <Section title={t('result.about')} defaultOpen>
              <p>{content.summary[lang]}</p>
              {content.spread[lang] && <p className="text-muted">{content.spread[lang]}</p>}
            </Section>

            {content.symptoms[lang].length > 0 && (
              <Section title={t('result.symptoms')}>
                <ul className="list-disc space-y-2 ps-5">{content.symptoms[lang].map((s) => <li key={s}>{s}</li>)}</ul>
              </Section>
            )}

            <Section title={t('result.prevention')} defaultOpen={scan.state === 'healthy'}>
              <ul className="list-disc space-y-2 ps-5">{content.prevention[lang].map((s) => <li key={s}>{s}</li>)}</ul>
            </Section>

            {scan.state !== 'healthy' && (
              <Section title={t('result.treatment')} defaultOpen>
                <TreatmentBlock title={t('result.cultural')} items={content.treatment.cultural[lang]} empty={t('result.noneYet')} />
                <TreatmentBlock title={t('result.organic')} items={content.treatment.organic[lang]} empty={t('result.noneYet')} />
                {content.treatment.chemical.length > 0 && (
                  <div>
                    <h3 className="mb-1 font-semibold text-canopy">{t('result.chemical')}</h3>
                    <ul className="space-y-3">
                      {content.treatment.chemical.map((c) => (
                        <li key={c.activeIngredient} className="rounded-xl bg-tint p-3">
                          <p className="font-medium">{c.activeIngredient}</p>
                          <p className="text-[0.95rem] text-muted">{c.note[lang]}</p>
                          {reviewed && c.dosage ? <p className="mt-1 font-medium">{c.dosage[lang]}</p> : null}
                        </li>
                      ))}
                    </ul>
                    {!reviewed && <p className="mt-2 text-sm text-muted">{t('result.dosageHidden')}</p>}
                  </div>
                )}
              </Section>
            )}

            {scan.state !== 'healthy' && content.treatment.chemical.length > 0 && (
              <Section title={t('result.safety')}>
                <ul className="list-disc space-y-2 ps-5">{content.safety[lang].map((s) => <li key={s}>{s}</li>)}</ul>
              </Section>
            )}

            {scan.state !== 'healthy' && (
              <Section title={t('result.expert')}>
                <p>{content.whenToCallExpert[lang]}</p>
              </Section>
            )}
          </div>
        </>
      )}

      <Notice icon={<Info aria-hidden="true" className="size-5" />}>{t('result.disclaimer')}</Notice>

      <div className="lg:hidden">{actions}</div>
      <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted">
        <TriangleAlert aria-hidden="true" className="size-3.5" />
        {t('result.model', { version: scan.modelVersion })}
      </p>
      </div>
    </article>
  );
}

function TreatmentBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold text-canopy">{title}</h3>
      {items.length > 0 ? <ul className="list-disc space-y-2 ps-5">{items.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="text-muted">{empty}</p>}
    </div>
  );
}

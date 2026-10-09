import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ScanLine } from 'lucide-react';
import { CROPS, type CropChoice } from '@agrixore/shared';
import { BlobImage } from '../../components/BlobImage';
import { Chip } from '../../components/Chip';
import { buttonClass } from '../../components/Button';
import { scanRepo } from '../../db/scans';
import { useSettings } from '../../db/settings';
import { formatTime } from '../../lib/format';
import { scanHeadline } from './describe';

export function HistoryPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.language);
  const [filter, setFilter] = useState<CropChoice | 'all'>('all');
  const scans = useLiveQuery(() => scanRepo.listNewestFirst(), []);
  const visible = (scans ?? []).filter((s) => filter === 'all' || s.crop === filter);

  return (
    <section className="space-y-4 pt-2">
      <h1 className="text-2xl font-bold text-canopy">{t('history.title')}</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>{t('history.all')}</Chip>
        {CROPS.map((c) => <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>{t(`crops.${c}`)}</Chip>)}
      </div>

      {scans && visible.length === 0 && (
        <div className="space-y-3 rounded-3xl bg-tint px-6 py-10 text-center">
          <p className="text-lg font-semibold text-canopy">{t('history.empty')}</p>
          <p className="text-muted">{t('history.emptyBody')}</p>
          <Link to="/scan" className={buttonClass('primary', 'mt-2')}>
            <ScanLine aria-hidden="true" className="size-5" />
            {t('history.emptyAction')}
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {visible.map((s) => (
          <li key={s.id}>
            <Link to={`/result/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <BlobImage blob={s.thumbnail} alt="" className="size-16 shrink-0 rounded-xl bg-tint object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-canopy">{scanHeadline(s.state, s.topClassId, lang, t)}</p>
                <p className="text-sm text-muted">{t(`crops.${s.crop}`)} · {t('result.confidence', { percent: Math.round(s.confidence * 100) })}</p>
                <p className="text-xs text-muted">{formatTime(s.createdAt, lang)}</p>
              </div>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

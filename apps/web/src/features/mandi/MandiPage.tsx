import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Bell, FlaskConical, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Notice } from '../../components/Notice';
import { useSettings } from '../../db/settings';
import { formatDate, formatNumber, formatTime } from '../../lib/format';
import { PLACES } from '../../lib/locations';
import { evaluateTargets, targetRepo } from './targets';
import { COMMODITIES, type PriceRow } from './types';
import { usePrices } from './usePrices';

export function MandiPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.language);
  const { rows, fetchedAt, isSample } = usePrices();
  const liveTargets = useLiveQuery(() => targetRepo.list(), []);
  const targets = useMemo(() => liveTargets ?? [], [liveTargets]);
  const [commodity, setCommodity] = useState<string>(COMMODITIES[0]);
  const [district, setDistrict] = useState('all');
  const [alertFor, setAlertFor] = useState<string | null>(null);
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');

  const districtIds = useMemo(() => Array.from(new Set(rows.map((r) => r.districtId))), [rows]);
  const districtName = (id: string) => PLACES.find((p) => p.id === id)?.name[lang] ?? id;
  const visible = rows.filter((r) => r.commodityId === commodity && (district === 'all' || r.districtId === district));
  const hits = useMemo(() => evaluateTargets(rows, targets), [rows, targets]);
  const rowKey = (r: PriceRow) => `${r.commodityId}-${r.districtId}`;

  async function saveAlert(row: PriceRow) {
    const value = Number(targetPrice);
    if (!Number.isFinite(value) || value <= 0) return;
    await targetRepo.add({ commodityId: row.commodityId, district: row.districtId, target: value, direction });
    setAlertFor(null);
    setTargetPrice('');
  }

  return (
    <section className="space-y-4 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-canopy">{t('mandi.title')}</h1>
        <p className="text-sm text-muted">{t('mandi.unit')}</p>
      </div>

      {isSample && (
        <Notice tone="warn" icon={<FlaskConical aria-hidden="true" className="size-5" />} title={t('mandi.sampleTitle')}>
          {t('mandi.sampleBody')}
        </Notice>
      )}
      {!isSample && fetchedAt && <p className="text-sm text-muted">{t('common.updated', { time: formatTime(fetchedAt, lang) })}</p>}

      {hits.map((h) => (
        <Notice key={h.target.id} icon={<Bell aria-hidden="true" className="size-5" />}>
          {t('mandi.targetHit', { commodity: t(`mandi.commodity.${h.row.commodityId}`), district: districtName(h.row.districtId), price: formatNumber(h.row.modal, lang) })}
        </Notice>
      ))}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {COMMODITIES.map((c) => <Chip key={c} selected={commodity === c} onClick={() => setCommodity(c)}>{t(`mandi.commodity.${c}`)}</Chip>)}
      </div>

      <label className="block">
        <span className="sr-only">{t('mandi.district')}</span>
        <select className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base" value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="all">{t('mandi.allDistricts')}</option>
          {districtIds.map((id) => <option key={id} value={id}>{districtName(id)}</option>)}
        </select>
      </label>

      {visible.length === 0 && <p className="py-6 text-center text-muted">{t('mandi.empty')}</p>}

      <ul className="space-y-3">
        {visible.map((r) => (
          <li key={rowKey(r)} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-canopy">{districtName(r.districtId)}</p>
                <p className="text-sm text-muted">{r.marketDate ? t('mandi.marketDate', { date: formatDate(r.marketDate, lang) }) : t('mandi.sample')}</p>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold tabular-nums text-leaf">{formatNumber(r.modal, lang)}</p>
                <p className="text-xs text-muted">{t('mandi.modal')}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-tint px-3 py-2 text-sm tabular-nums">
              <span>{t('mandi.min')} {formatNumber(r.min, lang)}</span>
              <TrendingUp aria-hidden="true" className="size-4 text-leaf" />
              <span>{t('mandi.max')} {formatNumber(r.max, lang)}</span>
            </div>

            {alertFor === rowKey(r) ? (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Chip selected={direction === 'above'} onClick={() => setDirection('above')}>{t('mandi.alertAbove')}</Chip>
                  <Chip selected={direction === 'below'} onClick={() => setDirection('below')}>{t('mandi.alertBelow')}</Chip>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm text-muted">{t('mandi.targetPrice')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base"
                  />
                </label>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setAlertFor(null)}>{t('common.cancel')}</Button>
                  <Button className="flex-1" onClick={() => void saveAlert(r)}>{t('mandi.saveAlert')}</Button>
                </div>
                <p className="text-xs text-muted">{t('mandi.alertNote')}</p>
              </div>
            ) : (
              <Button variant="soft" className="mt-3 w-full" onClick={() => { setAlertFor(rowKey(r)); setTargetPrice(''); }}>
                <Bell aria-hidden="true" className="size-5" />
                {t('mandi.setAlert')}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <div>
        <h2 className="mb-2 font-semibold">{t('mandi.yourAlerts')}</h2>
        {targets.length === 0 ? (
          <p className="text-muted">{t('mandi.noAlerts')}</p>
        ) : (
          <ul className="space-y-2">
            {targets.map((tg) => (
              <li key={tg.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <span>
                  {t(`mandi.commodity.${tg.commodityId}`)}, {districtName(tg.district)}
                  <span className="block text-sm text-muted">
                    {tg.direction === 'above' ? t('mandi.alertAbove') : t('mandi.alertBelow')} {formatNumber(tg.target, lang)}
                  </span>
                </span>
                <button type="button" aria-label={t('common.delete')} onClick={() => void targetRepo.remove(tg.id)} className="grid size-11 place-items-center rounded-full text-clay">
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

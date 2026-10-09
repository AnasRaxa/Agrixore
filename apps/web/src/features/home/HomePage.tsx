import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Camera, ChevronRight, CloudSun, History, Sprout, Store, TriangleAlert, WifiOff } from 'lucide-react';
import { buttonClass } from '../../components/Button';
import { BlobImage } from '../../components/BlobImage';
import { Notice } from '../../components/Notice';
import { Viewfinder } from '../../components/Viewfinder';
import { WeatherIcon } from '../../components/WeatherIcon';
import { db } from '../../db/db';
import { useSettings } from '../../db/settings';
import { formatNumber, formatTime } from '../../lib/format';
import { scanHeadline } from '../scan';
import { conditionFromCode, describeAlert, useForecast, weatherAlerts } from '../weather';

export function HomePage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.language);
  const { record } = useForecast();
  const last = useLiveQuery(async () => ({ scan: await db.scans.orderBy('createdAt').last() }), []);
  const data = record?.data;
  const alert = data ? weatherAlerts(data.daily)[0] : undefined;
  const lastScan = last?.scan;
  const tile = 'flex min-h-28 flex-col justify-between rounded-2xl border border-line bg-surface p-4';

  return (
    <div className="space-y-5 pt-2">
      <p className="text-lg font-semibold text-canopy">{t('home.greeting')}</p>

      <section className="relative overflow-hidden rounded-3xl bg-canopy p-6 text-white">
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -end-10 -top-10 size-64 text-sprout opacity-15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M100 190V20" /><path d="M100 150c-30-4-50-24-56-54" /><path d="M100 120c30-4 50-24 56-54" />
          <path d="M100 90c-24-3-40-18-46-40" /><path d="M100 62c20-3 34-14 40-32" />
        </svg>
        <div className="relative flex flex-col items-start gap-5">
          <Viewfinder className="size-20 text-sprout"><Sprout aria-hidden="true" className="size-9" /></Viewfinder>
          <div>
            <h1 className="text-2xl font-bold leading-snug">{t('home.heroTitle')}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-white/85">{t('home.heroBody')}</p>
          </div>
          <Link to="/scan" className={buttonClass('light', 'min-h-14 w-full text-lg')}>
            <Camera aria-hidden="true" className="size-6" />
            {t('home.heroButton')}
          </Link>
        </div>
      </section>

      {alert && (
        <Link to="/weather" className="block">
          <Notice tone="warn" icon={<TriangleAlert aria-hidden="true" className="size-5" />}>{describeAlert(alert, lang, t)}</Notice>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Link to="/weather" className={tile}>
          {data ? <WeatherIcon condition={conditionFromCode(data.current.code)} className="size-7 text-leaf" /> : <CloudSun aria-hidden="true" className="size-7 text-leaf" />}
          <span>
            <span className="block font-semibold text-canopy">{t('home.tileWeather')}</span>
            <span className="block text-sm text-muted">{data ? `${formatNumber(data.current.temperature, lang)}°` : t('home.weatherSetup')}</span>
          </span>
        </Link>
        <Link to="/mandi" className={tile}>
          <Store aria-hidden="true" className="size-7 text-leaf" />
          <span className="font-semibold text-canopy">{t('home.tileMandi')}</span>
        </Link>
        <Link to="/history" className={tile}>
          <History aria-hidden="true" className="size-7 text-leaf" />
          <span className="font-semibold text-canopy">{t('home.tileHistory')}</span>
        </Link>
      </div>

      {lastScan && (
        <section>
          <h2 className="mb-2 font-semibold">{t('home.lastScan')}</h2>
          <Link to={`/result/${lastScan.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <BlobImage blob={lastScan.thumbnail} alt="" className="size-16 shrink-0 rounded-xl bg-tint object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-canopy">{scanHeadline(lastScan.state, lastScan.topClassId, lang, t)}</p>
              <p className="text-sm text-muted">{t(`crops.${lastScan.crop}`)} · {formatTime(lastScan.createdAt, lang)}</p>
            </div>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted rtl:rotate-180" />
          </Link>
        </section>
      )}

      <p className="flex items-center justify-center gap-2 pb-2 text-sm text-muted">
        <WifiOff aria-hidden="true" className="size-4" />
        {t('app.tagline')}
      </p>
    </div>
  );
}

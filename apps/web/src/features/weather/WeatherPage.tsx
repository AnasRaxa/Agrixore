import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CloudOff, Droplets, MapPin, RefreshCw, Thermometer, TriangleAlert, Wind } from 'lucide-react';
import { STALE_AFTER_HOURS } from '@agrixore/shared';
import { buttonClass } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { WeatherIcon } from '../../components/WeatherIcon';
import { useSettings } from '../../db/settings';
import { formatNumber, formatTime, isStale } from '../../lib/format';
import { cn } from '../../lib/cn';
import { describeAlert, dayLabel } from './describeAlert';
import { conditionFromCode, irrigationAdvice, weatherAlerts } from './rules';
import { useForecast } from './useForecast';

export function WeatherPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.language);
  const { place, online, loading, record, isFetching, isError, refresh } = useForecast();

  if (!place) {
    return (
      <section className="space-y-4 rounded-3xl bg-tint px-6 py-10 text-center">
        <MapPin aria-hidden="true" className="mx-auto size-8 text-leaf" />
        <h1 className="text-xl font-bold text-canopy">{t('weather.locationNeeded')}</h1>
        <p className="text-muted">{t('weather.locationNeededBody')}</p>
        <Link to="/settings" className={buttonClass('primary')}>{t('weather.chooseLocation')}</Link>
      </section>
    );
  }

  const data = record?.data;
  const advice = data ? irrigationAdvice(data.daily) : null;
  const alerts = data ? weatherAlerts(data.daily) : [];
  const stale = record ? isStale(record.fetchedAt, STALE_AFTER_HOURS) : false;

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-canopy lg:text-3xl">
          <MapPin aria-hidden="true" className="size-6 shrink-0 text-leaf" />
          {place.name[lang]}
        </h1>
        <button
          type="button"
          onClick={refresh}
          disabled={!online || isFetching}
          aria-label={t('weather.refresh')}
          className="grid size-11 place-items-center rounded-full bg-tint text-canopy disabled:opacity-50"
        >
          <RefreshCw aria-hidden="true" className={cn('size-5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {!online && <Notice tone="warn" icon={<CloudOff aria-hidden="true" className="size-5" />}>{t('weather.offlineNote')}</Notice>}
      {online && isError && data && <Notice tone="warn">{t('weather.error')}</Notice>}
      {!loading && !data && <Notice>{t('weather.noData')}</Notice>}

      {data && record && (
        <div className="space-y-4 lg:space-y-6">
          <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
            <div className="space-y-2 lg:col-span-2">
              <div className="rounded-3xl bg-canopy p-6 text-white lg:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-6xl font-bold leading-none lg:text-7xl">{formatNumber(data.current.temperature, lang)}°</p>
                    <p className="mt-2 text-white/85 lg:text-lg">{t(`weather.condition.${conditionFromCode(data.current.code)}`)}</p>
                  </div>
                  <WeatherIcon condition={conditionFromCode(data.current.code)} className="size-16 text-sprout lg:size-20" />
                </div>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90 lg:text-base">
                  <span className="flex items-center gap-1.5"><Droplets aria-hidden="true" className="size-4" />{t('weather.humidity')} {formatNumber(data.current.humidity, lang)}%</span>
                  <span className="flex items-center gap-1.5"><Wind aria-hidden="true" className="size-4" />{t('weather.wind')} {formatNumber(data.current.wind, lang)} km/h</span>
                </div>
              </div>
              <p className="text-sm text-muted">{t('common.updated', { time: formatTime(record.fetchedAt, lang) })}{stale && ` · ${t('common.stale')}`}</p>
            </div>

            <div className="space-y-4 lg:col-span-3">
              {advice && (
                <Notice
                  tone={advice === 'hot' ? 'warn' : 'info'}
                  icon={advice === 'hot' ? <Thermometer aria-hidden="true" className="size-6" /> : <Droplets aria-hidden="true" className="size-6" />}
                  title={t('weather.irrigation')}
                  className="lg:p-6 lg:text-lg"
                >
                  {t(`weather.advice.${advice}`)}
                </Notice>
              )}
              {alerts.map((a) => (
                <Notice key={`${a.type}-${a.date}`} tone="warn" icon={<TriangleAlert aria-hidden="true" className="size-5" />}>
                  {describeAlert(a, lang, t)}
                </Notice>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold lg:text-lg">{t('weather.sevenDay')}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface md:grid md:grid-cols-2 md:divide-y-0 lg:grid-cols-7 lg:gap-3 lg:overflow-visible lg:border-0 lg:bg-transparent">
              {data.daily.map((d) => (
                <li
                  key={d.date}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 lg:flex lg:flex-col lg:gap-2 lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:p-4 lg:text-center"
                >
                  <span className="font-medium">{dayLabel(d.date, lang, t)}</span>
                  <span className="flex items-center gap-2 text-sm text-muted lg:flex-col lg:gap-1">
                    <WeatherIcon condition={conditionFromCode(d.code)} className="size-5 text-leaf lg:size-8" />
                    <span className="min-w-12 text-end lg:text-center">{formatNumber(d.rainProb, lang)}%</span>
                  </span>
                  <span className="min-w-20 text-end tabular-nums lg:text-center">{formatNumber(d.tMin, lang)}° / <b>{formatNumber(d.tMax, lang)}°</b></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

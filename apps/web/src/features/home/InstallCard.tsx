import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from '../../components/Button';
import { useSettings } from '../../db/settings';
import { promptInstall, useCanInstall } from '../../lib/install';

/** Offered only after the first successful scan, never on first load (PRODUCT.md F-PLAT-01). */
export function InstallCard({ scanCount }: { scanCount: number }) {
  const { t } = useTranslation();
  const canInstall = useCanInstall();
  const dismissed = useSettings((s) => s.installDismissed);
  const update = useSettings((s) => s.update);
  if (!canInstall || dismissed || scanCount < 1) return null;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <Download aria-hidden="true" className="size-6 shrink-0 text-leaf" />
      <div className="flex-1">
        <p className="font-semibold text-canopy">{t('install.title')}</p>
        <p className="text-sm text-muted">{t('install.body')}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => void update({ installDismissed: true })}>{t('install.dismiss')}</Button>
        <Button onClick={() => void promptInstall()}>{t('install.action')}</Button>
      </div>
    </section>
  );
}

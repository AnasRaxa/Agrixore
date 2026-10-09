import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';

/** Prompt-for-update: never reloads in the middle of a scan. */
export function UpdateBanner() {
  const { t } = useTranslation();
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div role="status" className="flex items-center justify-between gap-3 bg-canopy px-4 py-2 text-sm text-white">
      <span>{t('update.ready')}</span>
      <Button variant="light" className="min-h-9 px-3 text-sm" onClick={() => void updateServiceWorker(true)}>{t('update.action')}</Button>
    </div>
  );
}

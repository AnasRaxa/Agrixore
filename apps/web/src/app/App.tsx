import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../db/settings';
import { AppShell } from './AppShell';
import { HomePage } from '../features/home';
import { OnboardingPage } from '../features/onboarding';

// Route pages are lazy-loaded straight from their files so each screen becomes its own chunk.
const ScanPage = lazy(() => import('../features/scan/ScanPage').then((m) => ({ default: m.ScanPage })));
const ResultPage = lazy(() => import('../features/scan/ResultPage').then((m) => ({ default: m.ResultPage })));
const HistoryPage = lazy(() => import('../features/scan/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const WeatherPage = lazy(() => import('../features/weather/WeatherPage').then((m) => ({ default: m.WeatherPage })));
const MandiPage = lazy(() => import('../features/mandi/MandiPage').then((m) => ({ default: m.MandiPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const queryClient = new QueryClient();

function RequireOnboarding() {
  const done = useSettings((s) => s.onboardingDone);
  return done ? <Outlet /> : <Navigate to="/onboarding" replace />;
}

function Loading() {
  const { t } = useTranslation();
  return <p role="status" className="py-10 text-center text-muted">{t('common.loading')}</p>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<RequireOnboarding />}>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="scan" element={<ScanPage />} />
                <Route path="result/:id" element={<ResultPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="weather" element={<WeatherPage />} />
                <Route path="mandi" element={<MandiPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

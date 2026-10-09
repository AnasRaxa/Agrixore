import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/noto-naskh-arabic';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n } from './i18n';
import { useSettings } from './db/settings';
import { App } from './app/App';
import './lib/install';

async function boot() {
  await useSettings.getState().load();
  await initI18n(useSettings.getState().language);
  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();

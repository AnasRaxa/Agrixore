import { Component, type ErrorInfo, type ReactNode } from 'react';
import { i18n } from '../i18n';
import { buttonClass } from './Button';

/** Last line of defence: a friendly screen instead of a blank page. Never shows technical details. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="grid min-h-dvh place-items-center bg-paper p-6 text-center">
        <div className="max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-canopy">{i18n.t('common.errorTitle')}</h1>
          <p className="text-muted">{i18n.t('common.errorBody')}</p>
          <button type="button" className={buttonClass('primary')} onClick={() => window.location.reload()}>
            {i18n.t('common.reload')}
          </button>
        </div>
      </div>
    );
  }
}

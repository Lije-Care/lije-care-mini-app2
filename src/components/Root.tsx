import '../i18n/i18n.ts'; // This ensures i18n initializes

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n'; // Import the i18n instance
import { useEffect } from 'react';

import { App } from '@/components/App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';
import { publicUrl } from '@/helpers/publicUrl.ts';
import { Provider } from 'react-redux';
import { store } from "@/redux/store";
import { HMSRoomProvider } from '@100mslive/react-sdk';

function ErrorBoundaryError({ error }: { error: unknown }) {
  return (
    <div>
      <p>{i18n.t('An unhandled error occurred:')}</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

export function Root() {
  useEffect(() => {
    const syncDocumentLanguage = (language: string) => {
      document.documentElement.lang = language || 'en';
      document.title = i18n.t('Lije Care');
    };

    syncDocumentLanguage(i18n.language);
    i18n.on('languageChanged', syncDocumentLanguage);

    return () => {
      i18n.off('languageChanged', syncDocumentLanguage);
    };
  }, []);

  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <TonConnectUIProvider
        manifestUrl={publicUrl('tonconnect-manifest.json')}
      >
        <Provider store={store}>
          <HMSRoomProvider>
            <I18nextProvider i18n={i18n}>
              <App />
            </I18nextProvider>
          </HMSRoomProvider>
        </Provider>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}

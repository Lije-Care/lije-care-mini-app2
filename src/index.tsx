import 'i18next'
import ReactDOM from 'react-dom/client';

import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';

import '@telegram-apps/telegram-ui/dist/styles.css';
import './index.css';

// Mock the environment in case we are outside Telegram.
import './mockEnv.ts';

// Import service worker
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const normalizeChapaPaymentReturnLocation = () => {
  const currentUrl = new URL(window.location.href);
  const txRef = currentUrl.searchParams.get('tx_ref');
  const paymentSource = currentUrl.searchParams.get('payment_source');

  if (!txRef || paymentSource !== 'chapa') {
    return;
  }

  const hashValue = currentUrl.hash.startsWith('#')
    ? currentUrl.hash.slice(1)
    : currentUrl.hash;
  const [hashPath, hashSearch = ''] = hashValue.split('?');
  const hashParams = new URLSearchParams(hashSearch);

  if (hashPath !== '/shop/payment-status') {
    currentUrl.hash = `/shop/payment-status?tx_ref=${encodeURIComponent(txRef)}`;
  } else if (!hashParams.get('tx_ref')) {
    hashParams.set('tx_ref', txRef);
    currentUrl.hash = `${hashPath}?${hashParams.toString()}`;
  }

  currentUrl.searchParams.delete('payment_source');
  currentUrl.searchParams.delete('tx_ref');
  window.history.replaceState(null, '', currentUrl.toString());
};

const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
  normalizeChapaPaymentReturnLocation();

  // Configure all application dependencies.
  init(retrieveLaunchParams().startParam === 'debug' || import.meta.env.DEV);
  root.render(
    // <StrictMode>
    
      <Root />
    // </StrictMode>
  );

  // Register the Service Worker for PWA
  serviceWorkerRegistration.register();

} catch (e) {
  root.render(<EnvUnsupported />);
}

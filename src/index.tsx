import 'i18next'
import ReactDOM from 'react-dom/client';

import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';
import { ExternalShopPaymentStatusRoot } from '@/pages/ecommerce/checkout/ExternalShopPaymentStatusRoot.tsx';
import {
  isChapaPaymentStatusRoute,
  normalizeChapaPaymentReturnLocation,
} from '@/pages/ecommerce/checkout/chapaReturn.ts';

import '@telegram-apps/telegram-ui/dist/styles.css';
import './index.css';

// Mock the environment in case we are outside Telegram.
import './mockEnv.ts';

import { unregisterStaleServiceWorkers } from "./serviceWorkerRegistration";

const getLaunchParamsSafely = () => {
  try {
    return retrieveLaunchParams();
  } catch {
    return null;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root')!);

normalizeChapaPaymentReturnLocation();

const launchParams = getLaunchParamsSafely();
if (!launchParams && isChapaPaymentStatusRoute()) {
  root.render(<ExternalShopPaymentStatusRoot />);
  unregisterStaleServiceWorkers();
} else {
  try {
    if (!launchParams) {
      throw new Error('ERR_TELEGRAM_CONTEXT_REQUIRED');
    }

    // Configure all application dependencies.
    init(launchParams.startParam === 'debug' || import.meta.env.DEV);
    root.render(
      // <StrictMode>
      
        <Root />
      // </StrictMode>
    );

    unregisterStaleServiceWorkers();

  } catch (e) {
    root.render(<EnvUnsupported />);
  }
}

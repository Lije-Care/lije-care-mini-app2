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

const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
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

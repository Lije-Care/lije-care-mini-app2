# Telegram Mini App Development Guide

A comprehensive guide to building Telegram Mini Apps using React, TypeScript, and the official Telegram SDK. This guide uses the **Lije Care Mini App** as a practical reference.

---

## Table of Contents

1. [What is a Telegram Mini App?](#what-is-a-telegram-mini-app)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Project Structure](#project-structure)
5. [Telegram SDK Integration](#telegram-sdk-integration)
6. [Accessing Telegram User Data](#accessing-telegram-user-data)
7. [Theming & Dark Mode](#theming--dark-mode)
8. [Navigation & Routing](#navigation--routing)
9. [Back Button Handling](#back-button-handling)
10. [Development Environment](#development-environment)
11. [State Management](#state-management)
12. [API Communication](#api-communication)
13. [Real-Time Features](#real-time-features)
14. [Deployment](#deployment)
15. [Testing Outside Telegram](#testing-outside-telegram)
16. [Best Practices](#best-practices)

---

## What is a Telegram Mini App?

Telegram Mini Apps (formerly Web Apps) are web applications that run inside Telegram. They provide:

- **Native-like experience** within Telegram's interface
- **Access to user data** (name, username, photo, etc.)
- **Theme integration** matching Telegram's colors
- **Payment capabilities** via Telegram's payment system
- **TON blockchain** integration for crypto payments

Mini Apps open in a webview inside Telegram, giving users a seamless experience without leaving the app.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v18+) and npm/yarn/pnpm
- **Basic knowledge** of React and TypeScript
- **A Telegram Bot** (created via [@BotFather](https://t.me/BotFather))
- **HTTPS domain** (required for production)

### Creating a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Save your bot token
4. Send `/newapp` to create a Mini App linked to your bot
5. Provide your Mini App URL (must be HTTPS)

---

## Project Setup

### Step 1: Create a Vite Project

```bash
npm create vite@latest my-telegram-miniapp -- --template react-ts
cd my-telegram-miniapp
```

### Step 2: Install Dependencies

```bash
# Telegram SDK packages
npm install @telegram-apps/sdk-react @telegram-apps/telegram-ui

# Routing
npm install react-router-dom

# Additional utilities (optional)
npm install axios tailwindcss
```

### Step 3: Add Telegram Web App Script

In your `index.html`, add the Telegram Web App script **before** your app bundle:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>My Mini App</title>

    <!-- REQUIRED: Telegram Web App Script -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

---

## Project Structure

Here's the recommended structure based on Lije Care:

```
src/
├── api/                    # API configuration (axios instance)
│   └── axios.ts
├── components/             # Reusable components
│   ├── Root.tsx           # App wrapper with providers
│   ├── App.tsx            # Main app with routing
│   └── ProtectedRoute.tsx # Auth guard component
├── hooks/                  # Custom React hooks
│   └── useTelegramUser.ts # Hook for Telegram user data
├── navigation/             # Route definitions
│   └── routes.tsx
├── pages/                  # Page components
│   ├── IndexPage/
│   └── auth/
├── redux/                  # State management
│   ├── store.ts
│   └── slices/
├── types/                  # TypeScript interfaces
│   └── index.ts
├── index.tsx              # Entry point
├── init.ts                # Telegram SDK initialization
└── mockEnv.ts             # Development mock environment
```

---

## Telegram SDK Integration

### Entry Point (index.tsx)

```typescript
import ReactDOM from 'react-dom/client';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

import { Root } from './components/Root';
import { init } from './init';

// Get launch parameters from Telegram
const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
  // Retrieve debug flag from URL params
  const { debug } = retrieveLaunchParams();

  // Initialize Telegram SDK
  init(debug);

  root.render(<Root />);
} catch (error) {
  console.error('Failed to initialize:', error);
}
```

### SDK Initialization (init.ts)

```typescript
import {
  backButton,
  initData,
  init as initSDK,
  miniApp,
  themeParams,
  viewport,
} from '@telegram-apps/sdk-react';

export function init(debug: boolean): void {
  // Initialize the SDK
  initSDK();

  // Debug mode shows detailed logs
  if (debug) {
    import('eruda').then(lib => lib.default.init());
  }

  // Mount Telegram components
  backButton.mount();     // Enable back button control
  miniApp.mount();        // Core mini app features
  themeParams.mount();    // Theme colors
  initData.restore();     // Restore init data if available

  // Mount and configure viewport
  void viewport
    .mount()
    .then(() => {
      // Bind viewport height to CSS variable
      viewport.bindCssVars();
    })
    .catch(console.error);

  // Bind theme colors to CSS variables
  // This creates variables like --tg-theme-bg-color
  miniApp.bindCssVars();
  themeParams.bindCssVars();
}
```

### Available CSS Variables After Binding

```css
:root {
  --tg-theme-bg-color: #ffffff;
  --tg-theme-text-color: #000000;
  --tg-theme-hint-color: #999999;
  --tg-theme-link-color: #2481cc;
  --tg-theme-button-color: #5288c1;
  --tg-theme-button-text-color: #ffffff;
  --tg-theme-secondary-bg-color: #f0f0f0;
  --tg-viewport-height: 100vh;
  --tg-viewport-stable-height: 100vh;
}
```

---

## Accessing Telegram User Data

### Method 1: Direct Window Access

```typescript
// Access user data from Telegram WebApp object
const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;

if (telegramUser) {
  console.log('User ID:', telegramUser.id);
  console.log('First Name:', telegramUser.first_name);
  console.log('Last Name:', telegramUser.last_name);
  console.log('Username:', telegramUser.username);
  console.log('Language:', telegramUser.language_code);
  console.log('Is Premium:', telegramUser.is_premium);
}
```

### Method 2: SDK Hooks (Recommended)

```typescript
import { useSignal } from '@telegram-apps/sdk-react';
import { initData } from '@telegram-apps/sdk-react';

function UserProfile() {
  // Get user from SDK init data
  const user = useSignal(initData.user);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <p>Telegram ID: {user.id}</p>
    </div>
  );
}
```

### Custom Hook for User Data (useTelegramUser.ts)

```typescript
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

export function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get Telegram user from WebApp
        const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

        if (!telegramUser) {
          // Check localStorage for cached user
          const cached = localStorage.getItem('user');
          if (cached) {
            setUser(JSON.parse(cached));
          }
          setLoading(false);
          return;
        }

        // Fetch user from your backend
        const response = await axiosInstance.get(
          `/users/find-one/${telegramUser.id}`
        );

        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (err: any) {
        if (err.response?.status === 404) {
          // User doesn't exist, needs onboarding
          setError('USER_NOT_FOUND');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}
```

---

## Theming & Dark Mode

### Detecting Dark Mode

```typescript
import { useSignal } from '@telegram-apps/sdk-react';
import { miniApp } from '@telegram-apps/sdk-react';

function App() {
  // Reactive signal that updates when theme changes
  const isDark = useSignal(miniApp.isDark);

  return (
    <div className={isDark ? 'dark-theme' : 'light-theme'}>
      {/* Your app content */}
    </div>
  );
}
```

### Using Theme CSS Variables in Tailwind

```css
/* tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: var(--tg-theme-bg-color, #ffffff);
  --foreground: var(--tg-theme-text-color, #000000);
  --primary: var(--tg-theme-button-color, #5288c1);
  --primary-foreground: var(--tg-theme-button-text-color, #ffffff);
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### Using Telegram UI Components

```typescript
import { AppRoot, Button, Cell, List } from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';

function MyPage() {
  return (
    <AppRoot>
      <List>
        <Cell
          subtitle="Click me"
          onClick={() => console.log('Clicked!')}
        >
          Cell Item
        </Cell>
      </List>
      <Button size="l" stretched>
        Continue
      </Button>
    </AppRoot>
  );
}
```

---

## Navigation & Routing

### Route Configuration (routes.tsx)

```typescript
import { ComponentType } from 'react';
import { Home, User, Calendar } from 'lucide-react';

import IndexPage from '../pages/IndexPage';
import ProfilePage from '../pages/ProfilePage';
import SignInPage from '../pages/auth/SignInPage';

interface Route {
  path: string;
  Component: ComponentType;
  protected?: boolean;  // Requires authentication
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  // Public routes
  { path: '/signin', Component: SignInPage, protected: false },
  { path: '/signup', Component: SignUpPage, protected: false },

  // Protected routes
  {
    path: '/',
    Component: IndexPage,
    protected: true,
    title: 'Home',
    icon: <Home size={20} />
  },
  {
    path: '/profile',
    Component: ProfilePage,
    protected: true,
    title: 'Profile',
    icon: <User size={20} />
  },
];
```

### App Component with Routing

```typescript
import { HashRouter, Routes, Route } from 'react-router-dom';
import { routes } from '../navigation/routes';
import ProtectedRoute from './ProtectedRoute';
import BottomNav from './Templates/BottomNav';

function App() {
  const location = useLocation();

  // Hide bottom nav on auth pages
  const hideNavPaths = ['/signin', '/signup', '/onboarding'];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen">
      <Routes>
        {routes.map(({ path, Component, protected: isProtected }) => (
          <Route
            key={path}
            path={path}
            element={
              isProtected ? (
                <ProtectedRoute>
                  <Component />
                </ProtectedRoute>
              ) : (
                <Component />
              )
            }
          />
        ))}
      </Routes>

      {showNav && <BottomNav />}
    </div>
  );
}
```

### Protected Route Component

```typescript
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

**Important:** Use `HashRouter` instead of `BrowserRouter` for Telegram Mini Apps. Hash routing (`/#/path`) works better with Telegram's webview.

---

## Back Button Handling

Telegram provides a native back button that you can control:

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { backButton } from '@telegram-apps/sdk-react';

function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Show back button on all pages except home
    if (location.pathname !== '/') {
      backButton.show();
    } else {
      backButton.hide();
    }

    // Handle back button click
    const handleBack = () => {
      navigate(-1);
    };

    backButton.onClick(handleBack);

    return () => {
      backButton.offClick(handleBack);
    };
  }, [location, navigate]);
}

// Use in your App component
function App() {
  useBackButton();

  return (
    // ...
  );
}
```

---

## Development Environment

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    mkcert(), // Generates SSL certificates for HTTPS
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true, // Required for testing on mobile
  },
  base: '/', // Change if deploying to a subdirectory
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:https": "vite --host",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### Running Development Server

```bash
# Local development (browser only)
npm run dev

# HTTPS development (for mobile testing)
npm run dev:https
```

---

## State Management

### Redux Store Setup (store.ts)

```typescript
import { configureStore } from '@reduxjs/toolkit';
import childReducer from './slices/childSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    children: childReducer,
    cart: cartReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Example Slice (childSlice.ts)

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';

interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
}

interface ChildState {
  children: Child[];
  loading: boolean;
  error: string | null;
}

const initialState: ChildState = {
  children: [],
  loading: false,
  error: null,
};

export const fetchChildren = createAsyncThunk(
  'children/fetchAll',
  async (parentId: string) => {
    const response = await axiosInstance.get(`/children/find-all?parentId=${parentId}`);
    return response.data;
  }
);

const childSlice = createSlice({
  name: 'children',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChildren.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChildren.fulfilled, (state, action) => {
        state.loading = false;
        state.children = action.payload;
      })
      .addCase(fetchChildren.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      });
  },
});

export default childSlice.reducer;
```

### Provider Setup (Root.tsx)

```typescript
import { Provider } from 'react-redux';
import { store } from '../redux/store';

export function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
```

---

## API Communication

### Axios Instance (api/axios.ts)

```typescript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/#/signin';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### Environment Variables (.env)

```bash
VITE_API_URL=https://your-api-domain.com/api/v1
```

---

## Real-Time Features

### Socket.io Setup (utils/socket.ts)

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('wss://your-api-domain.com', {
  transports: ['websocket'],
  autoConnect: false,
});

export default socket;
```

### Using WebSockets in Components

```typescript
import { useEffect, useState } from 'react';
import socket from '../utils/socket';

function ChatScreen({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Connect and join room
    socket.connect();
    socket.emit('join_room', roomId);

    // Listen for new messages
    socket.on('receive_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_room', roomId);
      socket.off('receive_message');
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = (content: string) => {
    socket.emit('send_message', {
      roomId,
      content,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    // Chat UI
  );
}
```

---

## Deployment

### Option 1: GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json
"homepage": "https://yourusername.github.io/your-repo",
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Deploy
npm run deploy
```

### Option 2: Vercel/Netlify

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in dashboard

### Option 3: Custom Server

```bash
# Build the app
npm run build

# Serve the dist folder with any static server
npx serve dist
```

### Configuring Your Mini App in BotFather

1. Open `@BotFather` in Telegram
2. Send `/mybots` and select your bot
3. Select "Bot Settings" > "Menu Button" or "Mini App"
4. Provide your deployed HTTPS URL

---

## Testing Outside Telegram

### Mock Environment (mockEnv.ts)

Create a mock environment to test without Telegram:

```typescript
import {
  mockTelegramEnv,
  isTMA,
  parseInitData,
} from '@telegram-apps/sdk-react';

// Only run in development
if (import.meta.env.DEV) {
  // Check if already in Telegram
  if (!isTMA('simple')) {
    // Simulate Telegram environment
    const initDataRaw = new URLSearchParams([
      ['user', JSON.stringify({
        id: 99281932,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en',
        is_premium: true,
      })],
      ['hash', 'test_hash'],
      ['auth_date', String(Date.now() / 1000)],
    ]).toString();

    mockTelegramEnv({
      themeParams: {
        bgColor: '#ffffff',
        textColor: '#000000',
        buttonColor: '#5288c1',
        buttonTextColor: '#ffffff',
        secondaryBgColor: '#f0f0f0',
      },
      initData: parseInitData(initDataRaw),
      initDataRaw,
      platform: 'tdesktop',
      version: '7.0',
    });

    console.log('Mock Telegram environment initialized');
  }
}
```

Import this file early in your entry point:

```typescript
// index.tsx
import './mockEnv'; // Must be first!
import ReactDOM from 'react-dom/client';
// ...
```

---

## Best Practices

### 1. Mobile-First Design

```css
/* Ensure full viewport usage */
html, body, #root {
  height: 100%;
  height: 100vh;
  height: var(--tg-viewport-height, 100vh);
}

/* Safe area for notched devices */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### 2. Handle Loading States

```typescript
function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Tell Telegram the app is ready
    window.Telegram.WebApp.ready();
    setReady(true);
  }, []);

  if (!ready) return <LoadingScreen />;

  return <MainApp />;
}
```

### 3. Expand Viewport

```typescript
// Make the mini app full screen
window.Telegram.WebApp.expand();
```

### 4. Use Haptic Feedback

```typescript
// Trigger haptic feedback for better UX
window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
```

### 5. Security Considerations

- **Never trust client-side data** for sensitive operations
- **Validate initData** on your backend using the bot token
- **Use HTTPS** always (Telegram requires it)
- **Don't store sensitive data** in localStorage

### 6. Performance Tips

- Use code splitting with `React.lazy()`
- Implement service workers for offline support
- Minimize bundle size (tree shaking enabled by default in Vite)
- Use `useCallback` and `useMemo` for expensive operations

---

## Quick Reference

### Telegram WebApp Object

```typescript
// Access the global WebApp object
const tg = window.Telegram.WebApp;

tg.ready();                          // Signal app is ready
tg.expand();                         // Expand to full screen
tg.close();                          // Close the mini app
tg.MainButton.show();                // Show main button
tg.MainButton.setText('Continue');   // Set button text
tg.MainButton.onClick(callback);     // Handle click
tg.BackButton.show();                // Show back button
tg.showAlert('Hello!');              // Show alert
tg.showConfirm('Sure?', callback);   // Show confirmation
tg.openLink(url);                    // Open external link
tg.openTelegramLink(url);            // Open Telegram link
```

### Useful Links

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Apps SDK](https://github.com/Telegram-Mini-Apps/telegram-apps)
- [Telegram UI Components](https://github.com/Telegram-Mini-Apps/TelegramUI)
- [@BotFather](https://t.me/BotFather) - Create and manage bots

---

## Summary

Building a Telegram Mini App involves:

1. **Set up** a React/Vite project with TypeScript
2. **Add** the Telegram Web App script to your HTML
3. **Install** `@telegram-apps/sdk-react` and `@telegram-apps/telegram-ui`
4. **Initialize** the SDK and mount necessary components
5. **Access** user data via `window.Telegram.WebApp.initDataUnsafe`
6. **Use** CSS variables for theming
7. **Handle** the back button and navigation
8. **Deploy** to an HTTPS domain
9. **Configure** your bot in BotFather

The Lije Care Mini App demonstrates all these concepts in a production-ready healthcare application with authentication, real-time chat, video calls, and e-commerce features.

Happy coding!

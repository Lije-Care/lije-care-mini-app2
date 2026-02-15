import { useEffect, useState } from 'react';
import api from '@/api/axios';

type AuthStatus = 'loading' | 'authenticated' | 'needs_onboarding' | 'error';

const useTelegramAuth = () => {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const authenticate = async () => {
      // If already have a token, check if user has children for routing
      const existingToken = localStorage.getItem('access_token');
      if (existingToken) {
        const hasChildren = localStorage.getItem('has_children');
        if (hasChildren === 'false') {
          setStatus('needs_onboarding');
        } else {
          setStatus('authenticated');
        }
        return;
      }

      // Get Telegram user ID
      const telegramUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
      if (!telegramUser?.id) {
        setStatus('error');
        return;
      }

      try {
        const { data } = await api.post('/auth/telegram-signin', {
          telegramId: telegramUser.id.toString(),
        });

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data));
        localStorage.setItem('has_children', String(data.hasChildren));

        if (!data.hasChildren) {
          setStatus('needs_onboarding');
        } else {
          setStatus('authenticated');
        }
      } catch {
        setStatus('error');
      }
    };

    authenticate();
  }, []);

  return status;
};

export default useTelegramAuth;

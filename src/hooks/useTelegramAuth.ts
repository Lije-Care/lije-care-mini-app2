import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { AxiosError } from 'axios';
import api from '@/api/axios';

type AuthStatus = 'loading' | 'authenticated' | 'needs_onboarding' | 'not_registered' | 'error';

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

interface UseTelegramAuthResult {
  status: AuthStatus;
  telegramUser: TelegramUser | null;
}

const useTelegramAuth = (): UseTelegramAuthResult => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      // If already have a token, check if user has children for routing
      const existingToken = localStorage.getItem('access_token');
      if (existingToken) {
        const hasChildren = localStorage.getItem('has_children');
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (hasChildren === 'false' && onboardingCompleted !== 'true') {
          setStatus('needs_onboarding');
        } else {
          setStatus('authenticated');
        }
        return;
      }

      // Get Telegram user from launch params (proven to work, unlike initData signal)
      let tgUser: TelegramUser | null = null;
      try {
        const launchParams = retrieveLaunchParams();
        const user = launchParams.initData?.user;
        if (user) {
          tgUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          };
        }
      } catch {
        setStatus('error');
        return;
      }

      if (!tgUser?.id) {
        setStatus('error');
        return;
      }

      setTelegramUser(tgUser);

      try {
        const { data } = await api.post('/auth/telegram-signin', {
          telegramId: tgUser.id.toString(),
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
      } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        if (
          err?.response?.status === 404 ||
          err?.response?.data?.message === 'User not found'
        ) {
          setStatus('not_registered');
        } else {
          setStatus('error');
        }
      }
    };

    authenticate();
  }, []);

  return { status, telegramUser };
};

export default useTelegramAuth;

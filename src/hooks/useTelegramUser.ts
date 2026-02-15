import { useEffect, useState } from 'react';
import { initData } from '@telegram-apps/sdk-react';
import { AxiosError } from 'axios';
import api from '@/api/axios';
import { BackendUser } from '@/types';

const useTelegramUser = () => {
  const [user, setUser] = useState<BackendUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const telegramUser = initData.user();

      if (!telegramUser?.id) {
        console.warn('No Telegram user found.');
        return;
      }

      const getUser = async (id: string) => {
        try {
          const { data } = await api.get<BackendUser>(`users/find-one/${id}`);
          // localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
          console.log('Fetched existing user:', data);
        } catch (error) {
          const err = error as AxiosError<{ message: string }>;
          if (
            err?.response?.data?.message === 'User not found' ||
            err.message === 'User not found'
          ) {
            localStorage.removeItem('user');
            console.warn('User not found. Please ensure user exists in DB.');
          } else {
            console.error('Error fetching user:', err.message);
          }
        }
      };

     const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser: BackendUser = JSON.parse(storedUser);
          setUser(parsedUser); // 👈 Set local copy first for immediate use
          try {
            await getUser(parsedUser.id.toString()); // Still refresh from API
          } catch (error) {
            console.warn('Stored user invalid, trying Telegram user.');
          }
          return;
        }

      await getUser(telegramUser.id.toString());
    };

    fetchUser();
  }, []);

  return user;
};

export default useTelegramUser;

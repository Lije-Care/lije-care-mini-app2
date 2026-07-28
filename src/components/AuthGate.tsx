import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { requestContact } from '@telegram-apps/sdk-react';
import { useTranslation } from 'react-i18next';
import useTelegramAuth from '@/hooks/useTelegramAuth';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import logo from '@/assets/logo.png';
import { normalizePhoneNumber } from '@/utils/phone';

type RegistrationStep = 'welcome' | 'registering' | 'done';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const { refreshAuth } = useAuth();
  const { status, telegramUser, telegramInitData } = useTelegramAuth(refreshAuth);
  const [regStep, setRegStep] = useState<RegistrationStep>('welcome');
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const shouldBypassPhoneShare =
    import.meta.env.DEV &&
    import.meta.env.VITE_BYPASS_PHONE_SHARE === 'true' &&
    !!import.meta.env.VITE_DEV_PHONE_NUMBER;
  const canUseTelegramContactRequest =
    typeof window !== 'undefined' &&
    typeof window.Telegram !== 'undefined' &&
    !shouldBypassPhoneShare;

  const registerWithPhone = async (phone: string, autoLaunch = false) => {
    try {
      setRegError(null);
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedPhone) {
        throw new Error(t('Invalid phone number'));
      }

      setRegStep('registering');

      const { data } = await api.post('/auth/telegram-register', {
        ...(telegramInitData
          ? { initData: telegramInitData }
          : { telegramId: telegramUser!.id.toString() }),
        phone: normalizedPhone,
      });

      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      } else {
        localStorage.removeItem('refresh_token');
      }
      localStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('has_children', String(data.hasChildren));
      refreshAuth();

      setRegStep('done');
      if (autoLaunch) {
        setIsRegistered(true);
      }
    } catch {
      setRegStep('welcome');
      setRegError(t('Registration failed. Please try again.'));
    }
  };

  const handleSharePhone = async () => {
    try {
      setRegError(null);

      if (shouldBypassPhoneShare) {
        await registerWithPhone(import.meta.env.VITE_DEV_PHONE_NUMBER);
        return;
      }

      if (!canUseTelegramContactRequest) {
        setRegError(
          t('Phone sharing only works inside Telegram. For local development, set VITE_DEV_PHONE_NUMBER in .env.development.')
        );
        return;
      }

      const { contact } = await requestContact();
      await registerWithPhone(contact.phoneNumber);
    } catch {
      setRegError(t('Unable to get your phone number. Please open the mini app in Telegram and try again.'));
    }
  };

  const handleLaunch = () => {
    setIsRegistered(true);
  };

  useEffect(() => {
    if (
      status === 'not_registered' &&
      !isRegistered &&
      regStep === 'welcome' &&
      telegramUser &&
      shouldBypassPhoneShare
    ) {
      void registerWithPhone(import.meta.env.VITE_DEV_PHONE_NUMBER, true);
    }
  }, [status, isRegistered, regStep, telegramUser, shouldBypassPhoneShare]);

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <img
            src={logo}
            alt={t('Lije Care')}
            className="w-24 h-24 mx-auto mb-4"
          />
          <p className="text-gray-500 font-['Quicksand']">{t('Loading...')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <p className="text-gray-700 font-['Quicksand'] text-lg mb-2">
            {t('Unable to authenticate')}
          </p>
          <p className="text-gray-500 font-['Quicksand'] text-sm">
            {t('Please open this app from the Telegram bot.')}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'not_registered' && !isRegistered) {
    // Welcome & phone share step
    if (regStep === 'welcome') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-sm">
            <img
              src={logo}
              alt={t('Lije Care')}
              className="w-24 h-24 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-800 font-['Quicksand'] mb-3">
              {t('Welcome to Lije Care!')}
            </h1>
            <p className="text-gray-600 font-['Quicksand'] mb-8">
              {t('To get started, please share your phone number so we can create your account.')}
            </p>
            {regError && (
              <p className="text-red-500 font-['Quicksand'] text-sm mb-4">
                {regError}
              </p>
            )}
            <button
              onClick={handleSharePhone}
              className="w-full bg-blue-600 text-white font-['Quicksand'] font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t('Share Phone Number')}
            </button>
          </div>
        </div>
      );
    }

    // Registering step
    if (regStep === 'registering') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <img
            src={logo}
            alt={t('Lije Care')}
            className="w-24 h-24 mx-auto mb-4"
          />
            <p className="text-gray-500 font-['Quicksand']">{t('Creating your account...')}</p>
          </div>
        </div>
      );
    }

    // Done step
    if (regStep === 'done') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-sm">
            <img
              src={logo}
              alt={t('Lije Care')}
              className="w-24 h-24 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-800 font-['Quicksand'] mb-3">
              {t('Thank you for registering!')}
            </h1>
            <p className="text-gray-600 font-['Quicksand'] mb-8">
              {t("Your account has been created. Let's set up your child's profile.")}
            </p>
            <button
              onClick={handleLaunch}
              className="w-full bg-blue-600 text-white font-['Quicksand'] font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t('Get Started')}
            </button>
          </div>
        </div>
      );
    }
  }

  if (status === 'needs_onboarding' || (isRegistered && status === 'not_registered')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default AuthGate;

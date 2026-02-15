import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { requestContact } from '@telegram-apps/sdk-react';
import useTelegramAuth from '@/hooks/useTelegramAuth';
import api from '@/api/axios';

type RegistrationStep = 'welcome' | 'registering' | 'done';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { status, telegramUser } = useTelegramAuth();
  const [regStep, setRegStep] = useState<RegistrationStep>('welcome');
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSharePhone = async () => {
    try {
      setRegError(null);
      const { contact } = await requestContact();

      setRegStep('registering');

      const { data } = await api.post('/auth/telegram-register', {
        telegramId: telegramUser!.id.toString(),
        phone: contact.phoneNumber,
        username: telegramUser?.username || '',
      });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('has_children', String(data.hasChildren));

      setRegStep('done');
    } catch {
      setRegStep('welcome');
      setRegError('Registration failed. Please try again.');
    }
  };

  const handleLaunch = () => {
    setIsRegistered(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <img
            src="/lije-logo.png"
            alt="Lije Care"
            className="w-24 h-24 mx-auto mb-4"
          />
          <p className="text-gray-500 font-['Quicksand']">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <p className="text-gray-700 font-['Quicksand'] text-lg mb-2">
            Unable to authenticate
          </p>
          <p className="text-gray-500 font-['Quicksand'] text-sm">
            Please open this app from the Telegram bot.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'not_registered' && !isRegistered) {
    // Welcome & phone share step
    if (regStep === 'welcome') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-sm">
            <img
              src="/lije-logo.png"
              alt="Lije Care"
              className="w-24 h-24 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-800 font-['Quicksand'] mb-3">
              Welcome to Lije Care!
            </h1>
            <p className="text-gray-600 font-['Quicksand'] mb-8">
              To get started, please share your phone number so we can create your account.
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
              Share Phone Number
            </button>
          </div>
        </div>
      );
    }

    // Registering step
    if (regStep === 'registering') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <img
              src="/lije-logo.png"
              alt="Lije Care"
              className="w-24 h-24 mx-auto mb-4"
            />
            <p className="text-gray-500 font-['Quicksand']">Creating your account...</p>
          </div>
        </div>
      );
    }

    // Done step
    if (regStep === 'done') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-sm">
            <img
              src="/lije-logo.png"
              alt="Lije Care"
              className="w-24 h-24 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-800 font-['Quicksand'] mb-3">
              Thank you for registering!
            </h1>
            <p className="text-gray-600 font-['Quicksand'] mb-8">
              Your account has been created. Let's set up your child's profile.
            </p>
            <button
              onClick={handleLaunch}
              className="w-full bg-blue-600 text-white font-['Quicksand'] font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Get Started
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

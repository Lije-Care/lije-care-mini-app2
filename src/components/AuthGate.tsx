import { Navigate } from 'react-router-dom';
import useTelegramAuth from '@/hooks/useTelegramAuth';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const status = useTelegramAuth();

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

  if (status === 'needs_onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default AuthGate;

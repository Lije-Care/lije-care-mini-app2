import React, { useState } from 'react';
import { Button } from '@/components/ui';

interface PhoneStepProps {
  onNext: (phone: string) => void;
}

const PhoneStep: React.FC<PhoneStepProps> = ({ onNext }) => {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 9) {
      onNext(phone);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-b from-sky-50 to-white">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-sky-200/30 rounded-full -ml-16 -mt-16 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-sky-200/40 rounded-full -mr-20 -mb-20 blur-3xl"></div>

      {/* Logo */}
      <div className="relative mb-10">
        <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-sky-100 border border-sky-100">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
            <span className="text-white font-black text-3xl tracking-tight">LC</span>
          </div>
        </div>
        {/* Floating elements */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 animate-bounce">
          <span className="text-sm">✨</span>
        </div>
      </div>

      <h1 className="text-3xl font-black text-slate-800 text-center mb-3 tracking-tight">
        Welcome to LIJE CARE
      </h1>
      <p className="text-slate-500 text-center mb-10 max-w-xs leading-relaxed">
        Your partner in nurturing a healthy and happy child.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm relative z-10">
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
          Mobile Number
        </label>
        <div className="flex gap-3 mb-8">
          <div className="flex items-center justify-center px-5 py-4 bg-white rounded-2xl font-bold text-slate-700 border border-slate-200 shadow-sm">
            +251
          </div>
          <input
            type="tel"
            placeholder="912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={9}
            className="flex-1 px-5 py-4 bg-white rounded-2xl text-lg font-semibold text-slate-800 outline-none border border-slate-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>

        <Button
          type="submit"
          color="sky"
          fullWidth
          size="lg"
          disabled={phone.length < 9}
          className="shadow-xl shadow-sky-200"
        >
          Get OTP
        </Button>

        <p className="text-center text-slate-400 text-sm mt-6">
          We'll send a verification code to your phone
        </p>
      </form>

      {/* Trust Badges */}
      <div className="absolute bottom-8 flex items-center gap-4 text-slate-400 text-xs">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secure
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Trusted
        </span>
      </div>
    </div>
  );
};

export default PhoneStep;

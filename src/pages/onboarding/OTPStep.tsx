import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';

interface OTPStepProps {
  phone: string;
  onNext: () => void;
  onResend: () => void;
  onBack: () => void;
}

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const OTPStep: React.FC<OTPStepProps> = ({ phone, onNext, onResend, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      if (pastedData.length === 4) {
        inputRefs.current[3]?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length === 4) {
      onNext();
    }
  };

  const handleResend = () => {
    if (canResend) {
      onResend();
      setCountdown(60);
      setCanResend(false);
    }
  };

  const isComplete = otp.join('').length === 4;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-b from-sky-50 to-white relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
      >
        <BackIcon />
      </button>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-24 h-24 bg-emerald-200/30 rounded-full -mr-12 blur-2xl"></div>
      <div className="absolute bottom-40 left-0 w-32 h-32 bg-sky-200/30 rounded-full -ml-16 blur-2xl"></div>

      {/* Icon */}
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-sky-100 border border-sky-100 mb-8">
        <span className="text-4xl">📱</span>
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Verify Your Number</h2>
      <p className="text-slate-500 text-center mb-10 max-w-xs">
        We sent a 4-digit code to{' '}
        <span className="font-bold text-slate-700">+251 {phone}</span>
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        {/* OTP Inputs */}
        <div className="flex justify-between gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={`
                w-16 h-18 text-center text-3xl font-black
                bg-white rounded-2xl border-2 outline-none
                transition-all shadow-sm
                ${otp[i]
                  ? 'border-sky-400 bg-sky-50 text-sky-600'
                  : 'border-slate-200 text-slate-800'
                }
                focus:border-sky-500 focus:ring-4 focus:ring-sky-100
              `}
              style={{ height: '72px' }}
            />
          ))}
        </div>

        <Button
          type="submit"
          color="sky"
          fullWidth
          size="lg"
          disabled={!isComplete}
          className="shadow-xl shadow-sky-200"
        >
          Verify & Continue
        </Button>

        {/* Resend Section */}
        <div className="text-center mt-6">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sky-500 font-bold hover:text-sky-600 transition-colors"
            >
              Resend Code
            </button>
          ) : (
            <p className="text-slate-400 text-sm">
              Resend code in{' '}
              <span className="font-bold text-slate-600">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Tip */}
        <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm text-amber-700 text-center">
            <span className="font-bold">Tip:</span> Check your Telegram messages for the OTP code.
          </p>
        </div>
      </form>
    </div>
  );
};

export default OTPStep;

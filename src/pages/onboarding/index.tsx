import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneStep from './PhoneStep';
import OTPStep from './OTPStep';
import TermsStep from './TermsStep';
import ProfileStep from './ProfileStep';
import type { Gender } from '@/design-system/types';

type OnboardingStep = 'phone' | 'otp' | 'terms' | 'profile';

interface ChildData {
  name: string;
  gender: Gender;
  birthDate: string;
}

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('phone');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handlePhoneSubmit = (phoneNumber: string) => {
    setPhone(phoneNumber);
    // TODO: Call API to send OTP
    // For now, just move to next step
    setStep('otp');
  };

  const handleOTPVerified = () => {
    // TODO: Call API to verify OTP
    // For now, just move to terms step
    setStep('terms');
  };

  const handleTermsAccepted = () => {
    setStep('profile');
  };

  const handleResendOTP = () => {
    // TODO: Call API to resend OTP
    console.log('Resending OTP to', phone);
  };

  const handleProfileComplete = async (childData: ChildData) => {
    try {
      // TODO: Call API to create child profile
      // For now, just store in localStorage and navigate

      // Create a mock child object
      const newChild = {
        id: `child-${Date.now()}`,
        name: childData.name || 'My Little One',
        gender: childData.gender,
        birthDate: childData.birthDate || new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${childData.name || 'baby'}`,
      };

      // Store favorite child
      localStorage.setItem('favorite_child_id', newChild.id);

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkipProfile = () => {
    // Navigate to home without creating child profile
    navigate('/');
  };

  return (
    <div className="min-h-screen font-['Quicksand']">
      {step === 'phone' && <PhoneStep onNext={handlePhoneSubmit} />}
      {step === 'otp' && (
        <OTPStep
          phone={phone}
          onNext={handleOTPVerified}
          onResend={handleResendOTP}
          onBack={() => setStep('phone')}
        />
      )}
      {step === 'terms' && (
        <TermsStep
          onNext={handleTermsAccepted}
          onBack={() => setStep('otp')}
        />
      )}
      {step === 'profile' && (
        <ProfileStep
          onComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
        />
      )}
    </div>
  );
};

export default Onboarding;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TermsStep from './TermsStep';
import ProfileStep from './ProfileStep';
import type { Gender } from '@/design-system/types';

type OnboardingStep = 'terms' | 'profile';

interface ChildData {
  name: string;
  gender: Gender;
  birthDate: string;
}

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('terms');
  const navigate = useNavigate();

  const handleTermsAccepted = () => {
    setStep('profile');
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
      localStorage.setItem('has_children', 'true');
      localStorage.setItem('onboarding_completed', 'true');

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkipProfile = () => {
    // Mark onboarding as done so AuthGate doesn't loop back
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-['Quicksand']">
      {step === 'terms' && (
        <TermsStep
          onNext={handleTermsAccepted}
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

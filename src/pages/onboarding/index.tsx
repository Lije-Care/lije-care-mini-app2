import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import TermsStep from './TermsStep';
import ParentProfileStep from './ParentProfileStep';
import ProfileStep from './ProfileStep';
import { addChild } from '@/redux/slices/childSlice';
import type { AppDispatch } from '@/redux/store';
import type { ChildProfile, UserProfile } from '@/design-system/types';

type OnboardingStep = 'terms' | 'parentProfile' | 'childProfile';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('terms');
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleTermsAccepted = () => {
    setStep('parentProfile');
  };

  const handleParentComplete = (data: UserProfile) => {
    localStorage.setItem('parent_profile', JSON.stringify(data));
    setStep('childProfile');
  };

  const handleParentSkip = () => {
    setStep('childProfile');
  };

  const handleProfileComplete = async (childData: Omit<ChildProfile, 'id' | 'avatar'>) => {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const parentId = user?.id;

      if (parentId) {
        const genderMap: Record<string, 'Male' | 'Female'> = {
          boy: 'Male',
          girl: 'Female',
          'prefer-not-to-say': 'Male',
        };

        await dispatch(
          addChild({
            name: childData.name || 'My Little One',
            date_of_birth: childData.birthDate || new Date().toISOString(),
            gender: genderMap[childData.gender] || 'Male',
            weight: childData.weight || 0,
            height: childData.height || 0,
            muac: childData.muac || 0,
            parentId,
          })
        ).unwrap();
      }

      localStorage.setItem('has_children', 'true');
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate even if API fails - profile saved locally
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/');
    }
  };

  const handleSkipProfile = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-['Quicksand']">
      {step === 'terms' && (
        <TermsStep onNext={handleTermsAccepted} />
      )}
      {step === 'parentProfile' && (
        <ParentProfileStep
          onComplete={handleParentComplete}
          onSkip={handleParentSkip}
        />
      )}
      {step === 'childProfile' && (
        <ProfileStep
          onComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
        />
      )}
    </div>
  );
};

export default Onboarding;

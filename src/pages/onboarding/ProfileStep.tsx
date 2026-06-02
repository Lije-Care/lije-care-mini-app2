import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import type { Gender, ChildProfile } from '@/design-system/types';
import ChildBasicsForm, { type ChildBasicsData } from '@/components/forms/ChildBasicsForm';
import GrowthStatsForm, { type GrowthStatsData } from '@/components/forms/GrowthStatsForm';
import AllergenSelector from '@/components/forms/AllergenSelector';

type SubStep = 1 | 2 | 3 | 4;

interface ProfileStepProps {
  onComplete: (childData: Omit<ChildProfile, 'id' | 'avatar'>) => void;
  onSkip: () => void;
}

const ProfileStep: React.FC<ProfileStepProps> = ({ onComplete, onSkip }) => {
  const { t } = useTranslation();
  const [subStep, setSubStep] = useState<SubStep>(1);

  const [basics, setBasics] = useState<ChildBasicsData>({
    name: '',
    gender: 'boy' as Gender,
    birthDate: '',
  });

  const [growth, setGrowth] = useState<GrowthStatsData>({
    weight: '',
    height: '',
    muac: '',
    activityLevel: 'Moderate',
  });

  const [allergens, setAllergens] = useState<string[]>([]);

  const handleFinish = () => {
    onComplete({
      name: basics.name,
      gender: basics.gender,
      birthDate: basics.birthDate,
      weight: growth.weight ? parseFloat(growth.weight) : undefined,
      height: growth.height ? parseFloat(growth.height) : undefined,
      muac: growth.muac ? parseFloat(growth.muac) : undefined,
      activityLevel: growth.activityLevel,
      allergens: allergens.length > 0 ? allergens : undefined,
    });
  };

  const canProceedStep1 = basics.name.trim().length > 0 && basics.birthDate.length > 0;

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all ${
            s === subStep
              ? 'w-8 bg-emerald-500'
              : s < subStep
              ? 'w-2 bg-emerald-300'
              : 'w-2 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-40 h-40 bg-sky-200/30 rounded-full -ml-20 blur-3xl" />

      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-emerald-50/95 via-emerald-50/90 to-transparent backdrop-blur-sm z-10 px-6 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {subStep === 1 && t('Child Profile')}
              {subStep === 2 && t('Growth Stats')}
              {subStep === 3 && t('Allergen Check')}
              {subStep === 4 && t('All Set!')}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {subStep === 1 && t('Tell us about your little one')}
              {subStep === 2 && t('Optional growth measurements')}
              {subStep === 3 && t('Any food allergies?')}
              {subStep === 4 && t("You're ready to go")}
            </p>
          </div>
          {subStep < 4 && (
            <button
              onClick={subStep === 1 ? onSkip : () => setSubStep((subStep + 1) as SubStep)}
              className="text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors px-3 py-2 hover:bg-white/60 rounded-xl"
            >
              {subStep === 1 ? t('Skip for now') : t('Skip')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-4 pb-32">
        {stepIndicator}

        <div className="max-w-sm mx-auto">
          {/* Step 1: Basics */}
          {subStep === 1 && (
            <>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 border border-emerald-100">
                  <span className="text-5xl">👶</span>
                </div>
              </div>
              <ChildBasicsForm data={basics} onChange={setBasics} />
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mt-6">
                <div className="flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-emerald-800 font-bold text-sm mb-1">{t('Why do we need this?')}</p>
                    <p className="text-emerald-700 text-sm leading-relaxed">
                      {t("We use your child's info to provide personalized meal plans, growth tracking, and age-appropriate health recommendations.")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Button
                  color="mint"
                  fullWidth
                  size="lg"
                  className="shadow-xl shadow-emerald-200"
                  onClick={() => canProceedStep1 && setSubStep(2)}
                  disabled={!canProceedStep1}
                >
                  {t('Continue')}
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Growth Stats */}
          {subStep === 2 && (
            <>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 border border-emerald-100">
                  <span className="text-5xl">📊</span>
                </div>
              </div>
              <GrowthStatsForm data={growth} onChange={setGrowth} />
              <div className="pt-6 flex gap-3">
                <button
                  onClick={() => setSubStep(1)}
                  className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
                >
                  {t('Back')}
                </button>
                <Button
                  color="mint"
                  fullWidth
                  size="lg"
                  className="shadow-xl shadow-emerald-200"
                  onClick={() => setSubStep(3)}
                >
                  {t('Continue')}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Allergens */}
          {subStep === 3 && (
            <>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 border border-emerald-100">
                  <span className="text-5xl">🔍</span>
                </div>
              </div>
              <AllergenSelector selected={allergens} onChange={setAllergens} />
              <div className="pt-6 flex gap-3">
                <button
                  onClick={() => setSubStep(2)}
                  className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
                >
                  {t('Back')}
                </button>
                <Button
                  color="mint"
                  fullWidth
                  size="lg"
                  className="shadow-xl shadow-emerald-200"
                  onClick={() => setSubStep(4)}
                >
                  {t('Continue')}
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Confirmation */}
          {subStep === 4 && (
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center shadow-xl shadow-emerald-100">
                  <span className="text-6xl">🎉</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">
                {t('Welcome, {{name}}!', { name: basics.name })}
              </h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                {t("Everything is set up. You can always update your child's profile from the settings page.")}
              </p>

              {/* Summary Card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-100 border border-slate-100 text-left mb-8">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400 font-bold">{t('Name')}</span>
                    <span className="text-sm text-slate-700 font-bold">{basics.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400 font-bold">{t('Gender')}</span>
                    <span className="text-sm text-slate-700 font-bold capitalize">{t(basics.gender)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400 font-bold">{t('Birth Date')}</span>
                    <span className="text-sm text-slate-700 font-bold">{basics.birthDate}</span>
                  </div>
                  {growth.weight && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400 font-bold">{t('Weight')}</span>
                      <span className="text-sm text-slate-700 font-bold">{growth.weight} kg</span>
                    </div>
                  )}
                  {growth.height && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400 font-bold">{t('Height')}</span>
                      <span className="text-sm text-slate-700 font-bold">{growth.height} cm</span>
                    </div>
                  )}
                  {growth.muac && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400 font-bold">{t('MUAC')}</span>
                      <span className="text-sm text-slate-700 font-bold">{growth.muac} cm</span>
                    </div>
                  )}
                  {allergens.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400 font-bold">{t('Allergies')}</span>
                      <span className="text-sm text-rose-600 font-bold">{allergens.map((item) => t(item)).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSubStep(3)}
                  className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
                >
                  {t('Back')}
                </button>
                <Button
                  color="mint"
                  fullWidth
                  size="lg"
                  className="shadow-xl shadow-emerald-200"
                  onClick={handleFinish}
                >
                  {t('Finish Setup')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default ProfileStep;

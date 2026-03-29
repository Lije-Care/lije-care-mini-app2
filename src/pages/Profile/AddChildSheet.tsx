import React, { useState } from 'react';
import { Button } from '@/components/ui';
import type { Gender } from '@/design-system/types';
import ChildBasicsForm, { type ChildBasicsData } from '@/components/forms/ChildBasicsForm';
import GrowthStatsForm, { type GrowthStatsData } from '@/components/forms/GrowthStatsForm';
import AllergenSelector from '@/components/forms/AllergenSelector';
import { useTranslation } from 'react-i18next';

type SubStep = 1 | 2 | 3 | 4;

interface AddChildSheetProps {
  onComplete: (childData: {
    name: string;
    gender: Gender;
    birthDate: string;
    weight?: number;
    height?: number;
    muac?: number;
    activityLevel: 'Active' | 'Moderate' | 'Sedentary';
    allergens?: string[];
  }) => void;
  onClose: () => void;
}

const AddChildSheet: React.FC<AddChildSheetProps> = ({ onComplete, onClose }) => {
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

  const canProceedStep1 = basics.name.trim().length > 0 && basics.birthDate.length > 0;

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

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all ${
            s === subStep
              ? 'w-8 bg-sky-500'
              : s < subStep
              ? 'w-2 bg-sky-300'
              : 'w-2 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="px-2 pb-6">
      {stepIndicator}

      {/* Step 1: Basics */}
      {subStep === 1 && (
        <>
          <ChildBasicsForm data={basics} onChange={setBasics} />
          <div className="pt-6 flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
            >
              {t("Cancel")}
            </button>
            <Button
              color="sky"
              fullWidth
              size="lg"
              onClick={() => canProceedStep1 && setSubStep(2)}
              disabled={!canProceedStep1}
            >
              {t("Continue")}
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Growth */}
      {subStep === 2 && (
        <>
          <GrowthStatsForm data={growth} onChange={setGrowth} />
          <div className="pt-6 flex gap-3">
            <button
              onClick={() => setSubStep(1)}
              className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
            >
              {t("Back")}
            </button>
            <Button color="sky" fullWidth size="lg" onClick={() => setSubStep(3)}>
              {t("Continue")}
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Allergens */}
      {subStep === 3 && (
        <>
          <AllergenSelector selected={allergens} onChange={setAllergens} />
          <div className="pt-6 flex gap-3">
            <button
              onClick={() => setSubStep(2)}
              className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
            >
              {t("Back")}
            </button>
            <Button color="sky" fullWidth size="lg" onClick={() => setSubStep(4)}>
              {t("Continue")}
            </Button>
          </div>
        </>
      )}

      {/* Step 4: Summary */}
      {subStep === 4 && (
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">
            {t("Add Child Summary Title", { name: basics.name })}
          </h3>
          <p className="text-slate-500 text-sm mb-6">{t("Confirm child details prompt")}</p>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 text-left mb-6 space-y-2">
            <div className="flex justify-between">
                <span className="text-sm text-slate-400 font-bold">{t("Name")}</span>
                <span className="text-sm text-slate-700 font-bold">{basics.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400 font-bold">{t("Gender")}</span>
                <span className="text-sm text-slate-700 font-bold capitalize">
                  {basics.gender === "girl" ? t("Girl") : t("Boy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400 font-bold">{t("Date of Birth")}</span>
                <span className="text-sm text-slate-700 font-bold">{basics.birthDate}</span>
              </div>
              {growth.weight && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 font-bold">{t("Weight")}</span>
                  <span className="text-sm text-slate-700 font-bold">{growth.weight} kg</span>
                </div>
              )}
              {growth.height && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 font-bold">{t("Height")}</span>
                  <span className="text-sm text-slate-700 font-bold">{growth.height} cm</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-slate-400 font-bold">{t("Activity Level")}</span>
                <span className="text-sm text-slate-700 font-bold">{growth.activityLevel}</span>
              </div>
              {allergens.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400 font-bold">{t("Allergies")}</span>
                  <span className="text-sm text-rose-600 font-bold">{allergens.join(', ')}</span>
                </div>
              )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSubStep(3)}
              className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95"
            >
              {t("Back")}
            </button>
            <Button color="sky" fullWidth size="lg" onClick={handleFinish}>
              {t("Add Child")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddChildSheet;

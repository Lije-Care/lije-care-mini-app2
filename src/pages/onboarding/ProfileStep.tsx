import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { Gender } from '@/design-system/types';

interface ChildData {
  name: string;
  gender: Gender;
  birthDate: string;
}

interface ProfileStepProps {
  onComplete: (childData: ChildData) => void;
  onSkip: () => void;
}

const ProfileStep: React.FC<ProfileStepProps> = ({ onComplete, onSkip }) => {
  const [childData, setChildData] = useState<ChildData>({
    name: '',
    gender: 'boy',
    birthDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(childData);
  };

  const genderOptions: { value: Gender; label: string; emoji: string; color: string }[] = [
    { value: 'boy', label: 'Boy', emoji: '👦', color: 'sky' },
    { value: 'girl', label: 'Girl', emoji: '👧', color: 'rose' },
    { value: 'prefer-not-to-say', label: 'Other', emoji: '👶', color: 'purple' },
  ];

  const getGenderStyles = (value: Gender, isSelected: boolean) => {
    if (!isSelected) return 'bg-white border-slate-200 text-slate-600 hover:border-slate-300';

    switch (value) {
      case 'boy':
        return 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200';
      case 'girl':
        return 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200';
      default:
        return 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      <div className="absolute bottom-40 left-0 w-40 h-40 bg-sky-200/30 rounded-full -ml-20 blur-3xl"></div>

      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-emerald-50/95 via-emerald-50/90 to-transparent backdrop-blur-sm z-10 px-6 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Child Profile</h2>
            <p className="text-slate-500 text-sm mt-1">Tell us about your little one</p>
          </div>
          <button
            onClick={onSkip}
            className="text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors px-3 py-2 hover:bg-white/60 rounded-xl"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-4 pb-32">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 border border-emerald-100">
            <span className="text-5xl">👶</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
          <Input
            label="Child's Name"
            placeholder="e.g. Abenezer"
            value={childData.name}
            onChange={(e) => setChildData({ ...childData, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {genderOptions.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChildData({ ...childData, gender: value })}
                  className={`
                    py-4 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95
                    ${getGenderStyles(value, childData.gender === value)}
                  `}
                >
                  <span className="text-xl block mb-1">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
              Date of Birth
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 text-slate-800 font-medium transition-all"
                value={childData.birthDate}
                onChange={(e) =>
                  setChildData({ ...childData, birthDate: e.target.value })
                }
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-emerald-800 font-bold text-sm mb-1">Why do we need this?</p>
                <p className="text-emerald-700 text-sm leading-relaxed">
                  We use your child's info to provide personalized meal plans, growth tracking, and age-appropriate health recommendations.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              color="mint"
              fullWidth
              size="lg"
              className="shadow-xl shadow-emerald-200"
            >
              Finish Setup
            </Button>
          </div>
        </form>
      </div>

      {/* Bottom Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </div>
  );
};

export default ProfileStep;

import React, { useState } from 'react';
import { Input } from '@/components/ui';
import type { UserProfile } from '@/design-system/types';

interface ParentProfileStepProps {
  onComplete: (parentData: UserProfile) => void;
  onSkip: () => void;
}

const genderOptions = [
  { value: 'Male', label: 'Male', emoji: '👨' },
  { value: 'Female', label: 'Female', emoji: '👩' },
  { value: 'Prefer not to say', label: 'Prefer not to say', emoji: '🙂' },
];

const ParentProfileStep: React.FC<ParentProfileStepProps> = ({ onComplete, onSkip }) => {
  const [parentData, setParentData] = useState<UserProfile>({
    name: '',
    gender: '',
    birthDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(parentData);
  };

  const isValid = parentData.name.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/30 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-40 h-40 bg-purple-200/20 rounded-full -ml-20 blur-3xl" />

      <div className="sticky top-0 bg-gradient-to-b from-sky-50/95 via-sky-50/90 to-transparent backdrop-blur-sm z-10 px-6 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">About You</h2>
            <p className="text-slate-500 text-sm mt-1">Tell us a bit about yourself</p>
          </div>
          <button
            onClick={onSkip}
            className="text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors px-3 py-2 hover:bg-white/60 rounded-xl"
          >
            Skip for now
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 pb-32">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-sky-100 border border-sky-100">
            <span className="text-5xl">👤</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
          <Input
            label="Your Name"
            placeholder="e.g. Sara"
            value={parentData.name}
            onChange={(e) => setParentData({ ...parentData, name: e.target.value })}
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
                  onClick={() => setParentData({ ...parentData, gender: value })}
                  className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${
                    parentData.gender === value
                      ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
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
                className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 text-slate-800 font-medium transition-all"
                value={parentData.birthDate}
                onChange={(e) => setParentData({ ...parentData, birthDate: e.target.value })}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 ${
                isValid
                  ? 'bg-sky-500 shadow-xl shadow-sky-200 hover:bg-sky-600'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default ParentProfileStep;

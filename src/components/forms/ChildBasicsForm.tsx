import React from 'react';
import { Input } from '@/components/ui';
import type { Gender } from '@/design-system/types';

export interface ChildBasicsData {
  name: string;
  gender: Gender;
  birthDate: string;
}

interface ChildBasicsFormProps {
  data: ChildBasicsData;
  onChange: (data: ChildBasicsData) => void;
}

const genderOptions: { value: Gender; label: string; emoji: string }[] = [
  { value: 'boy', label: 'Boy', emoji: '👦' },
  { value: 'girl', label: 'Girl', emoji: '👧' },
];

const getGenderStyles = (value: Gender, isSelected: boolean) => {
  if (!isSelected) return 'bg-white border-slate-200 text-slate-600 hover:border-slate-300';
  return value === 'boy'
    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
    : 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200';
};

const ChildBasicsForm: React.FC<ChildBasicsFormProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <Input
        label="Child's Name"
        placeholder="e.g. Abenezer"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
      />

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">
          Gender
        </label>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...data, gender: value })}
              className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${getGenderStyles(value, data.gender === value)}`}
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
            value={data.birthDate}
            onChange={(e) => onChange({ ...data, birthDate: e.target.value })}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-xl">📅</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildBasicsForm;

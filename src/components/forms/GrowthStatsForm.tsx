import React from 'react';

export interface GrowthStatsData {
  weight: string;
  height: string;
  muac: string;
}

interface GrowthStatsFormProps {
  data: GrowthStatsData;
  onChange: (data: GrowthStatsData) => void;
}

const fields = [
  { key: 'weight' as const, label: 'Weight', unit: 'kg', emoji: '⚖️', placeholder: 'e.g. 10.5' },
  { key: 'height' as const, label: 'Height', unit: 'cm', emoji: '📏', placeholder: 'e.g. 75' },
  { key: 'muac' as const, label: 'MUAC', unit: 'cm', emoji: '💪', placeholder: 'e.g. 13.5' },
];

const GrowthStatsForm: React.FC<GrowthStatsFormProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-5">
      {fields.map(({ key, label, unit, emoji, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">
            {emoji} {label} ({unit})
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder={placeholder}
            className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 text-slate-800 font-medium transition-all"
            value={data[key]}
            onChange={(e) => onChange({ ...data, [key]: e.target.value })}
          />
        </div>
      ))}

      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
        <p className="text-sky-700 text-sm leading-relaxed">
          <span className="font-bold">Tip:</span> These measurements help track your child's growth. You can skip this and add them later.
        </p>
      </div>
    </div>
  );
};

export default GrowthStatsForm;

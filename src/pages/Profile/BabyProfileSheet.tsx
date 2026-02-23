import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui';
import type { Child } from '@/redux/slices/childSlice';

interface BabyProfileSheetProps {
  child: Child;
  onSave: (data: Partial<Child>) => void;
  onDelete: (childId: string) => void;
  onOpenAllergens: () => void;
}

const genderOptions: { value: string; label: string; emoji: string }[] = [
  { value: 'Male', label: 'Boy', emoji: '👦' },
  { value: 'Female', label: 'Girl', emoji: '👧' },
];

const BabyProfileSheet: React.FC<BabyProfileSheetProps> = ({
  child,
  onSave,
  onDelete,
  onOpenAllergens,
}) => {
  const [name, setName] = useState(child.name);
  const [gender, setGender] = useState(child.gender);
  const [birthDate, setBirthDate] = useState(child.date_of_birth?.split('T')[0] || '');
  const [weight, setWeight] = useState(child.weight?.toString() || '');
  const [height, setHeight] = useState(child.height?.toString() || '');
  const [muac, setMuac] = useState(child.muac?.toString() || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setName(child.name);
    setGender(child.gender);
    setBirthDate(child.date_of_birth?.split('T')[0] || '');
    setWeight(child.weight?.toString() || '');
    setHeight(child.height?.toString() || '');
    setMuac(child.muac?.toString() || '');
  }, [child]);

  const handleSave = () => {
    onSave({
      id: child.id,
      name,
      gender,
      date_of_birth: birthDate,
      weight: weight ? parseFloat(weight) : 0,
      height: height ? parseFloat(height) : 0,
      muac: muac ? parseFloat(muac) : null,
    });
  };

  if (showDeleteConfirm) {
    return (
      <div className="px-2 pb-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-3">Remove {child.name}?</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          This will permanently delete this child's profile and all associated data. This action cannot be undone.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => onDelete(child.id)}
            className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl active:scale-95 transition-all"
          >
            Yes, Remove Profile
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="w-full py-3 text-slate-500 font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pb-6 space-y-5">
      <Input
        label="Child's Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Abenezer"
      />

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">Gender</label>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGender(value)}
              className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${
                gender === value
                  ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-xl block mb-1">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Date of Birth</label>
        <input
          type="date"
          className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-400 text-slate-800 font-medium transition-all"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-400 text-slate-800 font-medium transition-all"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Height (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-400 text-slate-800 font-medium transition-all"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">MUAC (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-400 text-slate-800 font-medium transition-all"
            value={muac}
            onChange={(e) => setMuac(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={onOpenAllergens}
        className="w-full py-4 bg-rose-50 border-2 border-rose-200 text-rose-600 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <span>🔍</span> Manage Allergens
      </button>

      <button
        onClick={handleSave}
        className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all"
      >
        Save Changes
      </button>

      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full py-3 text-rose-500 font-bold text-sm"
      >
        Remove this profile
      </button>
    </div>
  );
};

export default BabyProfileSheet;

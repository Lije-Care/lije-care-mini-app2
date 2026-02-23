import React from 'react';
import AllergenSelector from '@/components/forms/AllergenSelector';

interface AllergenSheetProps {
  allergens: string[];
  onChange: (allergens: string[]) => void;
  onSave: () => void;
}

const AllergenSheet: React.FC<AllergenSheetProps> = ({ allergens, onChange, onSave }) => {
  return (
    <div className="px-2 pb-6">
      <AllergenSelector selected={allergens} onChange={onChange} />
      <button
        onClick={onSave}
        className="w-full mt-6 py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all"
      >
        Save Allergens
      </button>
    </div>
  );
};

export default AllergenSheet;

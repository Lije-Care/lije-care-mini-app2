import React from 'react';
import { ALLERGEN_LIST } from '@/data/allergens';

interface AllergenSelectorProps {
  selected: string[];
  onChange: (allergens: string[]) => void;
}

const ALLERGEN_EMOJIS: Record<string, string> = {
  'Milk': '🥛',
  'Egg': '🥚',
  'Peanuts': '🥜',
  'Tree Nuts': '🌰',
  'Soy': '🫘',
  'Wheat': '🌾',
  'Fish': '🐟',
  'Shellfish': '🦐',
  'Sesame': '🫘',
  'Honey': '🍯',
  'Strawberries': '🍓',
};

const AllergenSelector: React.FC<AllergenSelectorProps> = ({ selected, onChange }) => {
  const toggle = (allergen: string) => {
    if (selected.includes(allergen)) {
      onChange(selected.filter((a) => a !== allergen));
    } else {
      onChange([...selected, allergen]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 leading-relaxed">
        Select any allergens your child has. This helps us filter meal recommendations.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ALLERGEN_LIST.map((allergen) => {
          const isSelected = selected.includes(allergen);
          return (
            <button
              key={allergen}
              type="button"
              onClick={() => toggle(allergen)}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                isSelected
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-xl block mb-1">{ALLERGEN_EMOJIS[allergen] || '🔴'}</span>
              <span className="text-sm font-bold">{allergen}</span>
              {isSelected && (
                <span className="block text-[10px] font-bold uppercase text-rose-500 mt-1">
                  Allergic
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <p className="text-rose-700 text-sm font-bold mb-1">
            {selected.length} allergen{selected.length > 1 ? 's' : ''} selected
          </p>
          <p className="text-rose-600 text-xs">
            {selected.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default AllergenSelector;

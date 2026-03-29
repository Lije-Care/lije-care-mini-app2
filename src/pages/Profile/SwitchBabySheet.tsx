import React from 'react';
import type { Child } from '@/redux/slices/childSlice';
import { useTranslation } from 'react-i18next';

interface SwitchBabySheetProps {
  children: Child[];
  activeChildId: string | null;
  onSelect: (childId: string) => void;
  onAddChild: () => void;
}

const SwitchBabySheet: React.FC<SwitchBabySheetProps> = ({
  children,
  activeChildId,
  onSelect,
  onAddChild,
}) => {
  const { t } = useTranslation();

  return (
    <div className="px-2 pb-6">
      <p className="text-slate-500 text-sm mb-6">{t("Select child to manage")}</p>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
        {children.map((child) => {
          const isActive = child.id === activeChildId;
          const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(child.name)}`;
          return (
            <button
              key={child.id}
              onClick={() => onSelect(child.id)}
              className={`flex-shrink-0 w-28 flex flex-col items-center p-4 rounded-3xl border-2 transition-all active:scale-95 snap-center ${
                isActive
                  ? 'bg-sky-50 border-sky-400 shadow-lg shadow-sky-100'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl overflow-hidden mb-3 ${isActive ? 'ring-2 ring-sky-400 ring-offset-2' : ''}`}>
                <img
                  src={avatarUrl}
                  alt={child.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-sm font-bold truncate w-full text-center ${isActive ? 'text-sky-600' : 'text-slate-600'}`}>
                {child.name}
              </span>
              {isActive && (
                <span className="text-[10px] font-bold text-sky-500 uppercase mt-1">{t("Active")}</span>
              )}
            </button>
          );
        })}

        {/* Add Child Button */}
        <button
          onClick={onAddChild}
          className="flex-shrink-0 w-28 flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-all active:scale-95 snap-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <span className="text-3xl">+</span>
          </div>
          <span className="text-sm font-bold">{t("Add Child")}</span>
        </button>
      </div>
    </div>
  );
};

export default SwitchBabySheet;

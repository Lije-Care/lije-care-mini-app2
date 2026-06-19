import React, { useEffect, useRef, useState } from 'react';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrowVisibility = () => {
    const container = scrollRef.current;
    if (!container) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    const { scrollLeft, clientWidth, scrollWidth } = container;
    const remainingRight = scrollWidth - clientWidth - scrollLeft;
    const threshold = 8;

    setShowLeftArrow(scrollLeft > threshold);
    setShowRightArrow(remainingRight > threshold);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    updateArrowVisibility();

    container.addEventListener('scroll', updateArrowVisibility, { passive: true });
    window.addEventListener('resize', updateArrowVisibility);

    return () => {
      container.removeEventListener('scroll', updateArrowVisibility);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, [children.length]);

  const scrollCards = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const offset = Math.max(container.clientWidth * 0.75, 160);
    container.scrollBy({
      left: direction === 'right' ? offset : -offset,
      behavior: 'smooth',
    });
  };

  return (
    <div className="px-2 pb-6">
      <p className="mb-6 text-sm text-slate-500">{t('Select child to manage')}</p>

      <div className="relative">
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scrollCards('left')}
            aria-label={t('Previous child')}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-lg text-slate-600 shadow-lg"
          >
            <span aria-hidden="true">‹</span>
          </button>
        )}

        {showRightArrow && (
          <button
            type="button"
            onClick={() => scrollCards('right')}
            aria-label={t('Next child')}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-lg text-slate-600 shadow-lg"
          >
            <span aria-hidden="true">›</span>
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-1 pb-4 pr-12 hide-scrollbar snap-x scroll-smooth"
        >
          {children.map((child) => {
            const isActive = child.id === activeChildId;
            const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(child.name)}`;

            return (
              <button
                key={child.id}
                onClick={() => onSelect(child.id)}
                className={`flex w-28 flex-shrink-0 snap-center flex-col items-center rounded-3xl border-2 p-4 transition-all active:scale-95 ${
                  isActive
                    ? 'border-sky-400 bg-sky-50 shadow-lg shadow-sky-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`mb-3 h-16 w-16 overflow-hidden rounded-2xl ${
                    isActive ? 'ring-2 ring-sky-400 ring-offset-2' : ''
                  }`}
                >
                  <img
                    src={avatarUrl}
                    alt={child.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span
                  className={`w-full truncate text-center text-sm font-bold ${
                    isActive ? 'text-sky-600' : 'text-slate-600'
                  }`}
                >
                  {child.name}
                </span>
                {isActive && (
                  <span className="mt-1 text-[10px] font-bold uppercase text-sky-500">
                    {t('Active')}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAddChild}
            className="flex w-28 flex-shrink-0 snap-center flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-300 bg-sky-50 p-4 text-sky-600 transition-all active:scale-95"
          >
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <span className="text-3xl">+</span>
            </div>
            <span className="text-center text-sm font-bold">{t('Add Child')}</span>
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between px-1">
        <p className="text-xs text-slate-400">{t('Swipe to see more children')}</p>
        <button
          type="button"
          onClick={onAddChild}
          className="flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-200"
        >
          <span className="text-base leading-none">+</span>
          <span>{t('Add Child')}</span>
        </button>
      </div>
    </div>
  );
};

export default SwitchBabySheet;

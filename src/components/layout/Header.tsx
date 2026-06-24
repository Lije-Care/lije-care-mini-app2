import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/redux/store';
import { useProfileOverlay } from '@/context/ProfileOverlayContext';

const Header: React.FC = () => {
  const { openProfile } = useProfileOverlay();
  const { t, i18n } = useTranslation();

  // Get children from Redux store
  const { data: children } = useSelector((state: RootState) => state.children);
  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const selectedChild = children?.find((c) => c.id === favoriteChildId) ?? children?.[0];

  const avatarUrl = selectedChild
    ? selectedChild.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedChild.name)}`
    : null;

  const activeLanguage = i18n.language?.toLowerCase().startsWith('am') ? 'am' : 'en';

  const changeLanguage = (language: 'en' | 'am') => {
    if (activeLanguage === language) return;
    i18n.changeLanguage(language);
    localStorage.setItem('user-language', language);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 border-b border-[#E8DFC3] bg-[#FFFBF0]/90 px-4 py-4 backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1A12] shadow-md shadow-emerald-100">
            <span className="text-xs font-black text-[#F9C846]">LC</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-[#0B1A12]">{t('Lije Care')}</span>
            <span className="text-[10px] font-bold tracking-wider text-[#76A13B]">{t('Mini App')}</span>
          </div>
        </div>

        <button
          onClick={openProfile}
          className="relative rounded-full bg-gradient-to-br from-[#F9C846] to-[#76A13B] p-0.5 shadow-lg shadow-amber-100"
        >
          <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={selectedChild?.name || t('Profile')}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100">
                <span className="text-sm">👤</span>
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="mt-3 flex">
        <div className="inline-flex rounded-[1.35rem] border border-[#DCCFAD] bg-[#F3E8C9] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`min-w-[58px] rounded-[1rem] px-4 py-2 text-sm font-bold transition-all ${
              activeLanguage === 'en'
                ? 'bg-[#FFFDF6] text-[#0B1A12] shadow-sm'
                : 'text-[#5E7C31]'
            }`}
            aria-pressed={activeLanguage === 'en'}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('am')}
            className={`min-w-[58px] rounded-[1rem] px-4 py-2 text-sm font-bold transition-all ${
              activeLanguage === 'am'
                ? 'bg-[#FFFDF6] text-[#0B1A12] shadow-sm'
                : 'text-[#5E7C31]'
            }`}
            aria-pressed={activeLanguage === 'am'}
          >
            አማ
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

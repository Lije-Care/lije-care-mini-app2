import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useProfileOverlay } from '@/context/ProfileOverlayContext';

const Header: React.FC = () => {
  const { openProfile } = useProfileOverlay();

  // Get children from Redux store
  const { data: children } = useSelector((state: RootState) => state.children);
  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const selectedChild = children?.find((c) => c.id === favoriteChildId) ?? children?.[0];

  const avatarUrl = selectedChild
    ? selectedChild.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedChild.name)}`
    : null;

  return (
    <header className="sticky top-0 left-0 right-0 z-40 px-4 py-4 bg-[#FFFBF0]/90 backdrop-blur-lg flex items-center justify-between border-b border-[#E8DFC3]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#0B1A12] rounded-lg flex items-center justify-center shadow-md shadow-emerald-100">
          <span className="text-[#F9C846] font-black text-xs">LC</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-bold text-lg tracking-tight text-[#0B1A12]">LIJE CARE</span>
          <span className="text-[10px] font-bold text-[#76A13B] tracking-wider">Mini App</span>
        </div>
      </div>

      <button
        onClick={openProfile}
        className="relative p-0.5 rounded-full bg-gradient-to-br from-[#F9C846] to-[#76A13B] shadow-lg shadow-amber-100"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={selectedChild?.name || 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
          )}
        </div>
      </button>
    </header>
  );
};

export default Header;

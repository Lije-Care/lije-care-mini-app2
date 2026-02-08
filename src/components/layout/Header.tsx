import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ChevronDownIcon, PlusIcon } from '@/design-system/icons';

interface HeaderProps {
  onChildChange?: (childId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onChildChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Get children from Redux store
  const { data: children } = useSelector((state: RootState) => state.children);
  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const selectedChild = children?.find((c) => c.id === favoriteChildId) ?? children?.[0];

  const handleChildSelect = (childId: string) => {
    localStorage.setItem('favorite_child_id', childId);
    onChildChange?.(childId);
    setIsOpen(false);
  };

  const handleAddChild = () => {
    setIsOpen(false);
    navigate('/add-child');
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 px-4 py-4 bg-white/80 backdrop-blur-lg flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-md shadow-sky-100">
          <span className="text-white font-black text-xs">LC</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800">LIJE CARE</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white bg-white">
            <img
              src={selectedChild?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedChild?.name || 'baby'}`}
              alt="Child"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-bold text-slate-700 truncate max-w-[80px]">
            {selectedChild?.name || 'Select'}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Your Children
                </span>
              </div>

              {/* Children List */}
              {children && children.length > 0 ? (
                children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildSelect(child.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-sky-50 transition-colors ${
                      selectedChild?.id === child.id ? 'bg-sky-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-slate-100">
                      <img
                        src={child.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${child.name}`}
                        alt={child.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {child.name}
                    </span>
                    {selectedChild?.id === child.id && (
                      <span className="ml-auto text-sky-500 text-xs">Active</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-400">
                  No children added yet
                </div>
              )}

              {/* Add Child Button */}
              <button
                onClick={handleAddChild}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-sky-50 transition-colors border-t border-slate-100"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Add Child</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

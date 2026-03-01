import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS } from '@/design-system/colors';
import {
  HomeIcon,
  AssessmentIcon,
  MealsIcon,
  ShopIcon,
  CallCenterIcon,
} from '@/design-system/icons';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  color: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, color: COLORS.sky, path: '/' },
  { id: 'assessment', label: 'Assess', icon: <AssessmentIcon />, color: COLORS.mint, path: '/assessment' },
  { id: 'meals', label: 'Meals', icon: <MealsIcon />, color: COLORS.yellow, path: '/meals' },
  { id: 'shop', label: 'Shop', icon: <ShopIcon />, color: COLORS.coral, path: '/ecommerce' },
  { id: 'help', label: 'Help', icon: <CallCenterIcon />, color: COLORS.purple, path: '/consultation' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Find active index based on current path
  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  });

  // Default to home if no match found
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const slotWidth = 100 / NAV_ITEMS.length;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="relative h-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden">
        {/* Animated Sliding Pill */}
        <div
          className="absolute inset-y-2 transition-all duration-300 ease-out"
          style={{
            width: `${slotWidth}%`,
            left: `${safeActiveIndex * slotWidth}%`,
          }}
        >
          <div
            className="h-full mx-2 rounded-xl"
            style={{
              backgroundColor: NAV_ITEMS[safeActiveIndex]?.color + '20',
              border: `1.5px solid ${NAV_ITEMS[safeActiveIndex]?.color}40`,
            }}
          />
        </div>

        <div className="relative flex items-center h-full">
          {NAV_ITEMS.map((item, index) => {
            const isActive = index === safeActiveIndex;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200"
                style={{
                  color: isActive ? item.color : '#94A3B8',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  className="transition-transform duration-200"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 6px ${item.color}40)` : 'none',
                  }}
                >
                  {React.cloneElement(item.icon, {
                    stroke: isActive ? item.color : '#94A3B8',
                    strokeWidth: isActive ? 2.5 : 2,
                  } as React.SVGProps<SVGSVGElement>)}
                </div>
                <span
                  className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Safe padding for mobile bottom bars */}
      <div className="h-safe-bottom" />
    </div>
  );
};

export default BottomNav;

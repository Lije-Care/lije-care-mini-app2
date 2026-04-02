import React from 'react';

type BadgeVariant = 'solid' | 'outline' | 'soft';
type BadgeColor = 'sky' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'indigo';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  className?: string;
}

const colorStyles: Record<BadgeColor, Record<BadgeVariant, string>> = {
  sky: {
    solid: 'bg-[#F9C846] text-[#0B1A12]',
    outline: 'border border-[#F9C846] text-[#C89213]',
    soft: 'bg-[#FFF8DE] text-[#C89213] border border-[#FFF0BF]',
  },
  emerald: {
    solid: 'bg-[#76A13B] text-white',
    outline: 'border border-[#76A13B] text-[#76A13B]',
    soft: 'bg-[#EEF6E5] text-[#5E832D] border border-[#DDECC7]',
  },
  amber: {
    solid: 'bg-amber-400 text-slate-900',
    outline: 'border border-amber-400 text-amber-600',
    soft: 'bg-amber-50 text-amber-600 border border-amber-100',
  },
  rose: {
    solid: 'bg-rose-500 text-white',
    outline: 'border border-rose-500 text-rose-500',
    soft: 'bg-rose-50 text-rose-600 border border-rose-200',
  },
  purple: {
    solid: 'bg-[#0B1A12] text-white',
    outline: 'border border-[#0B1A12] text-[#0B1A12]',
    soft: 'bg-[#1B3B2B] text-white border border-[#31414A]',
  },
  slate: {
    solid: 'bg-[#31414A] text-white',
    outline: 'border border-[#D4C8A6] text-[#51606C]',
    soft: 'bg-[#F8F1DA] text-[#51606C] border border-[#E8DFC3]',
  },
  indigo: {
    solid: 'bg-indigo-500 text-white',
    outline: 'border border-indigo-500 text-indigo-500',
    soft: 'bg-indigo-100 text-indigo-600',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[8px]',
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'soft',
  color = 'slate',
  size = 'sm',
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center
        rounded-full
        font-bold
        uppercase
        tracking-wide
        ${colorStyles[color][variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;

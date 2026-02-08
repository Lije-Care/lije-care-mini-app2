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
    solid: 'bg-sky-500 text-white',
    outline: 'border border-sky-500 text-sky-500',
    soft: 'bg-sky-50 text-sky-600 border border-sky-100',
  },
  emerald: {
    solid: 'bg-emerald-500 text-white',
    outline: 'border border-emerald-500 text-emerald-500',
    soft: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
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
    solid: 'bg-purple-500 text-white',
    outline: 'border border-purple-500 text-purple-500',
    soft: 'bg-purple-50 text-purple-600 border border-purple-100',
  },
  slate: {
    solid: 'bg-slate-700 text-white',
    outline: 'border border-slate-300 text-slate-600',
    soft: 'bg-slate-50 text-slate-600 border border-slate-100',
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

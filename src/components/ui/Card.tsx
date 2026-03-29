import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'lg' | 'xl' | '2xl' | '3xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const roundedMap = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-[2rem]',
};

const shadowMap = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  rounded = '3xl',
  shadow = 'sm',
  border = true,
}) => {
  const baseClasses = 'bg-white transition-all';
  const interactiveClasses = onClick ? 'cursor-pointer active:scale-[0.98]' : '';
  const borderClass = border ? 'border border-slate-50' : '';

  return (
    <div
      className={`
        ${baseClasses}
        ${paddingMap[padding]}
        ${roundedMap[rounded]}
        ${shadowMap[shadow]}
        ${borderClass}
        ${interactiveClasses}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

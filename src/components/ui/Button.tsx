import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'sky' | 'mint' | 'yellow' | 'coral' | 'purple' | 'slate' | 'emerald';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const colorStyles: Record<ButtonColor, Record<ButtonVariant, string>> = {
  sky: {
    primary: 'bg-[#F9C846] hover:bg-[#E4AE1F] text-[#0B1A12] shadow-lg shadow-amber-100',
    secondary: 'bg-[#FFF8DE] hover:bg-[#FFF0BF] text-[#76A13B] border border-[#F8F1DA]',
    outline: 'border-2 border-[#76A13B] text-[#76A13B] hover:bg-[#EEF6E5]',
    ghost: 'text-[#76A13B] hover:bg-[#EEF6E5]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  mint: {
    primary: 'bg-[#76A13B] hover:bg-[#5E832D] text-white shadow-lg shadow-emerald-100',
    secondary: 'bg-[#EEF6E5] hover:bg-[#DDECC7] text-[#5E832D] border border-[#DDECC7]',
    outline: 'border-2 border-[#76A13B] text-[#76A13B] hover:bg-[#EEF6E5]',
    ghost: 'text-[#76A13B] hover:bg-[#EEF6E5]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  yellow: {
    primary: 'bg-[#F9C846] hover:bg-[#E4AE1F] text-[#0B1A12] shadow-lg shadow-amber-100',
    secondary: 'bg-[#FFF8DE] hover:bg-[#FFF0BF] text-[#C89213] border border-[#FFF0BF]',
    outline: 'border-2 border-[#F9C846] text-[#C89213] hover:bg-[#FFF8DE]',
    ghost: 'text-[#C89213] hover:bg-[#FFF8DE]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  coral: {
    primary: 'bg-[#76A13B] hover:bg-[#5E832D] text-white shadow-lg shadow-emerald-100',
    secondary: 'bg-[#EEF6E5] hover:bg-[#DDECC7] text-[#5E832D] border border-[#DDECC7]',
    outline: 'border-2 border-[#76A13B] text-[#76A13B] hover:bg-[#EEF6E5]',
    ghost: 'text-[#76A13B] hover:bg-[#EEF6E5]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  purple: {
    primary: 'bg-[#0B1A12] hover:bg-[#1B3B2B] text-white shadow-lg shadow-slate-300',
    secondary: 'bg-[#1B3B2B] hover:bg-[#31414A] text-white border border-[#1B3B2B]',
    outline: 'border-2 border-[#0B1A12] text-[#0B1A12] hover:bg-[#FFFBF0]',
    ghost: 'text-[#0B1A12] hover:bg-[#FFF8DE]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  slate: {
    primary: 'bg-[#0B1A12] hover:bg-[#1B3B2B] text-white shadow-lg shadow-slate-300',
    secondary: 'bg-[#F8F1DA] hover:bg-[#E8DFC3] text-[#51606C] border border-[#E8DFC3]',
    outline: 'border-2 border-[#D4C8A6] text-[#51606C] hover:bg-[#FFFBF0]',
    ghost: 'text-[#51606C] hover:bg-[#F8F1DA]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  emerald: {
    primary: 'bg-[#76A13B] hover:bg-[#5E832D] text-white shadow-lg shadow-emerald-100',
    secondary: 'bg-[#EEF6E5] hover:bg-[#DDECC7] text-[#5E832D] border border-[#DDECC7]',
    outline: 'border-2 border-[#76A13B] text-[#76A13B] hover:bg-[#EEF6E5]',
    ghost: 'text-[#76A13B] hover:bg-[#EEF6E5]',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  color = 'sky',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2';
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed active:scale-100' : '';

  return (
    <button
      className={`
        ${baseClasses}
        ${colorStyles[color][variant]}
        ${sizeStyles[size]}
        ${widthClass}
        ${disabledClass}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};

export default Button;

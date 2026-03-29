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
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-200',
    secondary: 'bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100',
    outline: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-50',
    ghost: 'text-sky-500 hover:bg-sky-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  mint: {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    secondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100',
    outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50',
    ghost: 'text-emerald-500 hover:bg-emerald-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  yellow: {
    primary: 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-200',
    secondary: 'bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100',
    outline: 'border-2 border-amber-400 text-amber-500 hover:bg-amber-50',
    ghost: 'text-amber-500 hover:bg-amber-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  coral: {
    primary: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200',
    secondary: 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100',
    outline: 'border-2 border-rose-500 text-rose-500 hover:bg-rose-50',
    ghost: 'text-rose-500 hover:bg-rose-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  purple: {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-200',
    secondary: 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100',
    outline: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-50',
    ghost: 'text-purple-500 hover:bg-purple-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  slate: {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-300',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200',
    outline: 'border-2 border-slate-300 text-slate-600 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  emerald: {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    secondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100',
    outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50',
    ghost: 'text-emerald-500 hover:bg-emerald-50',
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

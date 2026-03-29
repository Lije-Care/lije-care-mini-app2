import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftElement,
  rightElement,
  containerClassName = '',
  className = '',
  ...props
}) => {
  const baseInputClasses = `
    w-full px-5 py-4
    bg-slate-50
    border border-slate-200
    rounded-2xl
    text-slate-800
    font-medium
    outline-none
    transition-colors
    focus:border-sky-400
    focus:bg-white
    placeholder:text-slate-400
  `;

  const errorClasses = error ? 'border-rose-400 focus:border-rose-500' : '';
  const withLeftElement = leftElement ? 'pl-14' : '';
  const withRightElement = rightElement ? 'pr-14' : '';

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftElement && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftElement}
          </div>
        )}
        <input
          className={`
            ${baseInputClasses}
            ${errorClasses}
            ${withLeftElement}
            ${withRightElement}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-500 ml-1">{error}</p>
      )}
    </div>
  );
};

export default Input;

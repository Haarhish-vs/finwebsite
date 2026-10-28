import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, prefixIcon, suffix, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#334155] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {prefixIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              {prefixIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`block w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
              prefixIcon ? 'pl-9' : 'pl-3'
            } ${suffix ? 'pr-12' : 'pr-3'} py-2 bg-white ${
              error
                ? 'border-red-400 text-red-900 focus:ring-red-400 focus:border-red-400'
                : 'border-[#CBD5E1] text-[#0F172A] focus:ring-[#1E3A8A] focus:border-[#1E3A8A]'
            } disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#64748B]">
              {suffix}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

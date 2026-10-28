import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#1E3A8A] text-white hover:bg-[#1e40af] active:bg-[#1d4ed8] focus:ring-[#1E3A8A] shadow-sm',
    secondary:
      'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] focus:ring-slate-400',
    outlined:
      'border border-[#CBD5E1] text-[#0F172A] bg-white hover:bg-slate-50 active:bg-slate-100 focus:ring-[#1E3A8A]',
    danger:
      'bg-[#EF4444] text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500 shadow-sm',
    ghost:
      'text-[#475569] hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
};

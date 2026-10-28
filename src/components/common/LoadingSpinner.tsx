import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading data...',
  size = 'md',
  fullHeight = false,
}) => {
  const spinnerSizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 ${
        fullHeight ? 'min-h-[300px]' : ''
      }`}
    >
      <div
        className={`${spinnerSizes} animate-spin rounded-full border-2 border-slate-200 border-t-[#1E3A8A]`}
      />
      {label && <p className="mt-3 text-xs font-medium text-[#64748B]">{label}</p>}
    </div>
  );
};

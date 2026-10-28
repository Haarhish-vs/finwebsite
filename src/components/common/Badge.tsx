import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
  }[size];

  const variantClasses = {
    success: 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
    error: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
    info: 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]',
    navy: 'bg-[#DBEAFE] text-[#1E3A8A] border border-[#BFDBFE]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-md uppercase tracking-wider ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};

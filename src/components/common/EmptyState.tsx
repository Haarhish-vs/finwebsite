import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white border border-slate-200">
      {icon && (
        <div className="mb-3.5 p-3.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-[#0F172A]">{title}</h4>
      <p className="mt-1 text-xs text-[#64748B] max-w-sm">{subtitle}</p>
      {actionText && onAction && (
        <div className="mt-4">
          <Button variant="outlined" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

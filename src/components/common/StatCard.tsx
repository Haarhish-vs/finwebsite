import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string; // e.g. text-[#10B981]
  bgColor: string; // e.g. bg-[#D1FAE5]
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  bgColor,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${bgColor} ${accentColor}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">{value}</h3>
        <p className="mt-1 text-xs text-[#64748B] line-clamp-1">{subtitle}</p>
      </div>
    </div>
  );
};

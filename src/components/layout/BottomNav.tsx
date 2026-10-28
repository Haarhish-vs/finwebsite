import React from 'react';
import { LayoutDashboard, Users, CreditCard, BarChart3 } from 'lucide-react';
import type { NavTabId } from './Sidebar';

interface BottomNavProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const items = [
    { id: 'dashboard' as NavTabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers' as NavTabId, label: 'Customers', icon: Users },
    { id: 'payments' as NavTabId, label: 'Payments', icon: CreditCard },
    { id: 'reports' as NavTabId, label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'text-[#1E3A8A]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <div
              className={`p-1 rounded-md transition-colors ${
                isActive ? 'bg-[#DBEAFE]' : ''
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

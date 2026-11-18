import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Landmark,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export type NavTabId = 'dashboard' | 'customers' | 'payments' | 'reports';

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTabId,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'customers' as NavTabId,
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'payments' as NavTabId,
      label: 'Payments',
      icon: CreditCard,
    },
    {
      id: 'reports' as NavTabId,
      label: 'Reports',
      icon: BarChart3,
    },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out of the admin panel?')) {
      logout();
    }
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white min-h-screen select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="p-2.5 rounded-xl bg-[#1E3A8A] text-white shadow-sm">
          <Landmark className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">finance-app</h2>
          <span className="text-xs text-[#94A3B8]">v1.0.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#DBEAFE] text-[#1E3A8A] shadow-sm'
                  : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? 'text-[#1E3A8A]' : 'text-[#64748B]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.email || 'Admin'}
            </p>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Administrator
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>

        <div className="text-[11px] text-[#94A3B8] text-center">
          Backend: finance-app-odjk
        </div>
      </div>
    </aside>
  );
};

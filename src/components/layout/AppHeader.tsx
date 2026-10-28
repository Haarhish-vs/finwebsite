import React, { useEffect, useState } from 'react';
import { Landmark, Shield, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { healthApi } from '../../api/health';

interface AppHeaderProps {
  title: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onRefresh,
  isRefreshing = false,
}) => {
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      await healthApi.checkApi();
      setServerOk(true);
    } catch {
      setServerOk(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Heartbeat check every 60s
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Title & App Brand icon on mobile */}
      <div className="flex items-center gap-3">
        <div className="flex sm:hidden p-2 rounded-lg bg-[#1E3A8A] text-white">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight line-clamp-1">
            {title}
          </h1>
        </div>
      </div>

      {/* Actions & Role Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Server Connection Status Pill */}
        <div
          title={
            serverOk === true
              ? 'Deployed backend is connected (https://finance-app-odjk.onrender.com)'
              : serverOk === false
              ? 'Backend is waking up from sleep or offline'
              : 'Pinging backend...'
          }
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            serverOk === true
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : serverOk === false
              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {serverOk === true ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : serverOk === false ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-slate-400 animate-ping" />
          )}
          <span>{serverOk === true ? 'Live API' : serverOk === false ? 'Waking Up...' : 'Checking'}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={() => {
              checkHealth();
              onRefresh();
            }}
            disabled={isRefreshing || checking}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Refresh current page"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || checking ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Administrator Badge (Matches Flutter AppConfig.adminRoleTitle) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] font-semibold text-xs border border-[#BFDBFE]">
          <Shield className="h-3.5 w-3.5 text-[#1E3A8A]" />
          <span className="hidden sm:inline">Single Administrator</span>
          <span className="sm:hidden">Admin</span>
        </div>
      </div>
    </header>
  );
};

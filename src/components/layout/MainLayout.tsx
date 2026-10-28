import React from 'react';
import { Sidebar, type NavTabId } from './Sidebar';
import { BottomNav } from './BottomNav';
import { AppHeader } from './AppHeader';

interface MainLayoutProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  title: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  onSelectTab,
  title,
  onRefresh,
  isRefreshing,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row antialiased">
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <AppHeader
          title={title}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={onSelectTab} />
    </div>
  );
};

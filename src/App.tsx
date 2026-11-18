import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { LoginScreen } from './features/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import type { NavTabId } from './components/layout/Sidebar';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { PaymentsHubScreen } from './features/payments/PaymentsHubScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const titles: Record<NavTabId, string> = {
    dashboard: 'Executive Dashboard',
    customers: 'Customer Directory',
    payments: 'Payments & Installments Hub',
    reports: 'Financial Reports & Analytics',
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleViewLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentTab('payments');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        if (tab !== 'payments') {
          setSelectedLoanId(null);
        }
      }}
      title={titles[currentTab]}
      onRefresh={handleRefresh}
    >
      <div key={refreshKey}>
        {currentTab === 'dashboard' && (
          <DashboardScreen onNavigateTab={(tab) => setCurrentTab(tab)} />
        )}
        {currentTab === 'customers' && (
          <CustomersScreen onViewLoan={handleViewLoan} />
        )}
        {currentTab === 'payments' && (
          <PaymentsHubScreen
            selectedLoanId={selectedLoanId}
            onClearSelectedLoan={() => setSelectedLoanId(null)}
          />
        )}
        {currentTab === 'reports' && <ReportsScreen />}
      </div>
    </MainLayout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

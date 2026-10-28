import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import type { NavTabId } from './components/layout/Sidebar';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { CustomersScreen } from './features/customers/CustomersScreen';
import { PaymentsHubScreen } from './features/payments/PaymentsHubScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';

export function App() {
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

export default App;

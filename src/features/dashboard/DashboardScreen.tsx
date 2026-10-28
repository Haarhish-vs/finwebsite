import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { OriginateLoanModal } from '../loanOrigination/OriginateLoanModal';
import { LoanDetailsModal } from '../payments/LoanDetailsModal';
import { CustomerDetailsModal } from '../customers/CustomerDetailsModal';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { customerApi } from '../../api/customers';
import { loanApi } from '../../api/loans';
import { installmentApi } from '../../api/installments';
import type { Customer, Loan } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import {
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { NavTabId } from '../../components/layout/Sidebar';

interface DashboardScreenProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aggregated totals matching Flutter DashboardScreen
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  const [totalInitialCollected, setTotalInitialCollected] = useState(0);
  const [totalLoansCount, setTotalLoansCount] = useState(0);
  const [totalLoanCollected, setTotalLoanCollected] = useState(0);
  const [overdueInstallmentsCount, setOverdueInstallmentsCount] = useState(0);

  // Recent records
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  // Modals state
  const [isOriginateLoanOpen, setIsOriginateLoanOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customerRes, loanRes, overdueRes] = await Promise.all([
        customerApi.getCustomers({ page: 1, limit: 5 }),
        loanApi.getLoans({ page: 1, limit: 5 }),
        installmentApi.getInstallments({ status: 'overdue', limit: 1 }),
      ]);

      // Sum initial deposits
      const custs = customerRes.customers || [];
      const initDeposit = custs.reduce((acc, c) => acc + (c.initial_amount_collected || 0), 0);

      // Sum loan collections
      const lns = loanRes.loans || [];
      const collectedAmt = lns.reduce((acc, l) => acc + (l.amount_collected || 0), 0);

      setRecentCustomers(custs);
      setTotalCustomerCount(customerRes.pagination?.totalRecords || custs.length);
      setTotalInitialCollected(initDeposit);

      setRecentLoans(lns);
      setTotalLoansCount(loanRes.pagination?.totalRecords || lns.length);
      setTotalLoanCollected(collectedAmt);

      setOverdueInstallmentsCount(overdueRes.pagination?.totalRecords || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6">
      {/* Financial Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Financial Overview
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time portfolio collections, active loans, and delinquency health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="sm"
            onClick={loadDashboardData}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOriginateLoanOpen(true)}
            icon={<PlusCircle className="h-4 w-4" />}
          >
            Add Customer / Loan
          </Button>
        </div>
      </div>

      {/* Error alert with retry */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outlined" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Executive KPI Metric Cards (Matching Flutter DashboardScreen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Loan Payments Collected"
          value={formatCurrency(totalLoanCollected)}
          subtitle="Recurring collections across loans"
          icon={<span className="font-bold text-sm">₹</span>}
          accentColor="text-emerald-700"
          bgColor="bg-emerald-100"
          onClick={() => onNavigateTab('payments')}
        />

        <StatCard
          title="Total Borrowers"
          value={`${totalCustomerCount} Registered`}
          subtitle={`${totalCustomerCount} profiles • ${formatCurrency(totalInitialCollected)} deposits`}
          icon={<Users className="h-5 w-5" />}
          accentColor="text-[#1E3A8A]"
          bgColor="bg-[#DBEAFE]"
          onClick={() => onNavigateTab('customers')}
        />

        <StatCard
          title="Originated Loans"
          value={`${totalLoansCount} Active Plans`}
          subtitle="Weekly & monthly loans running"
          icon={<CreditCard className="h-5 w-5" />}
          accentColor="text-sky-700"
          bgColor="bg-sky-100"
          onClick={() => onNavigateTab('payments')}
        />

        <StatCard
          title="Overdue Installments"
          value={`${overdueInstallmentsCount} Overdue`}
          subtitle={
            overdueInstallmentsCount > 0
              ? 'Requires immediate follow-up'
              : 'No delinquent balances'
          }
          icon={
            overdueInstallmentsCount > 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )
          }
          accentColor={overdueInstallmentsCount > 0 ? 'text-red-700' : 'text-emerald-700'}
          bgColor={overdueInstallmentsCount > 0 ? 'bg-red-100' : 'bg-emerald-100'}
          onClick={() => onNavigateTab('payments')}
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase tracking-wider text-slate-500">
          Quick Actions
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOriginateLoanOpen(true)}
            icon={<PlusCircle className="h-4 w-4" />}
          >
            Add Customer / Loan
          </Button>
          <Button
            variant="outlined"
            size="sm"
            onClick={() => onNavigateTab('customers')}
            icon={<Users className="h-4 w-4" />}
          >
            View Customers
          </Button>
          <Button
            variant="outlined"
            size="sm"
            onClick={() => onNavigateTab('payments')}
            icon={<CreditCard className="h-4 w-4" />}
          >
            Loan Plans
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateTab('reports')}
            icon={<FileSpreadsheet className="h-4 w-4" />}
          >
            Financial Reports
          </Button>
        </div>
      </div>

      {/* Two-Column Grid: Recent Loans & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Recent Active Loans Originated */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Recent Loans Originated</h3>
              <p className="text-xs text-slate-400">Recently disbursed lending contracts</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('payments')}
              className="text-xs font-semibold text-[#1E3A8A] hover:underline"
            >
              View All
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading recent loans..." />
          ) : recentLoans.length === 0 ? (
            <EmptyState
              title="No Loans Originated"
              subtitle='Click "+ Add Customer / Loan" to create your first loan plan.'
              icon={<CreditCard className="h-6 w-6" />}
              actionText="+ Originate Loan"
              onAction={() => setIsOriginateLoanOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {recentLoans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#DBEAFE] text-[#1E3A8A] font-bold text-xs flex-shrink-0">
                      ₹
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#0F172A] block">
                        {loan.customer_name || 'Borrower'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {loan.plan_code} • {loan.frequency.toUpperCase()} ({loan.total_installments} Periods)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-[#1E3A8A] block">
                      {formatCurrency(loan.total_amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {Math.round((loan.progress || 0) * 100)}% collected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Recent Registered Borrowers */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Recent Registered Borrowers</h3>
              <p className="text-xs text-slate-400">Newly added customer profiles</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('customers')}
              className="text-xs font-semibold text-[#1E3A8A] hover:underline"
            >
              View All
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading borrowers..." />
          ) : recentCustomers.length === 0 ? (
            <EmptyState
              title="No Customers Found"
              subtitle="Borrowers added to the platform will be listed here."
              icon={<Users className="h-6 w-6" />}
              actionText="+ Add Customer"
              onAction={() => setIsOriginateLoanOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setIsCustomerDetailsOpen(true);
                  }}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center uppercase flex-shrink-0">
                      {cust.full_name
                        .split(' ')
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#0F172A] block">
                        {cust.full_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {cust.phone || 'No phone provided'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-600 block">
                      {formatCurrency(cust.initial_amount_collected)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Deposit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Originate Loan Modal */}
      <OriginateLoanModal
        isOpen={isOriginateLoanOpen}
        onClose={() => setIsOriginateLoanOpen(false)}
        onSuccess={loadDashboardData}
      />

      {/* Loan Details Modal */}
      <LoanDetailsModal
        isOpen={Boolean(selectedLoanId)}
        onClose={() => setSelectedLoanId(null)}
        loanId={selectedLoanId}
        onUpdated={loadDashboardData}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={isCustomerDetailsOpen}
        onClose={() => {
          setIsCustomerDetailsOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onEdit={(c) => {
          setEditingCustomer(c);
          setIsCustomerFormOpen(true);
        }}
        onOriginateLoan={() => {
          setIsOriginateLoanOpen(true);
        }}
        onCustomerUpdated={loadDashboardData}
        onCustomerDeleted={loadDashboardData}
        onViewLoan={(id) => setSelectedLoanId(id)}
      />

      {/* Customer Edit Modal */}
      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={loadDashboardData}
        customer={editingCustomer}
      />
    </div>
  );
};

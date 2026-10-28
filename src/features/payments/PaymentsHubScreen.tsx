import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RecordPaymentModal } from './RecordPaymentModal';
import { EditInstallmentModal } from './EditInstallmentModal';
import { LoanDetailsModal } from './LoanDetailsModal';
import { paymentApi } from '../../api/payments';
import { loanApi } from '../../api/loans';
import { installmentApi } from '../../api/installments';
import type { Payment, Loan, Installment } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate, formatDateTime } from '../../utils/date';
import {
  Receipt,
  Layers,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Edit2,
  ChevronRight,
  Search,
} from 'lucide-react';

interface PaymentsHubScreenProps {
  initialTab?: 'transactions' | 'plans' | 'installments';
  selectedLoanId?: string | null;
  onClearSelectedLoan?: () => void;
}

export const PaymentsHubScreen: React.FC<PaymentsHubScreenProps> = ({
  initialTab = 'transactions',
  selectedLoanId,
  onClearSelectedLoan,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'plans' | 'installments'>(initialTab);

  // Data states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [installmentStatus, setInstallmentStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isEditInstallmentOpen, setIsEditInstallmentOpen] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(selectedLoanId || null);

  useEffect(() => {
    if (selectedLoanId) {
      setActiveLoanId(selectedLoanId);
    }
  }, [selectedLoanId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'transactions') {
        const res = await paymentApi.getPayments({ limit: 50 });
        setPayments(res.payments || []);
      } else if (activeTab === 'plans') {
        const res = await loanApi.getLoans({ search: searchQuery || undefined, limit: 50 });
        setLoans(res.loans || []);
      } else if (activeTab === 'installments') {
        const res = await installmentApi.getInstallments({
          status: installmentStatus === 'all' ? undefined : installmentStatus,
          limit: 100,
        });
        setInstallments(res.installments || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, installmentStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-5">
      {/* Tab Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Payments & Installments Hub
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor real transactions, active loan plans, and installment recovery.
          </p>
        </div>

        {/* 3 Nav Tabs matching Flutter UI */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Transactions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'plans'
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Payment Plans</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('installments')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'installments'
                ? 'bg-white text-[#1E3A8A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Installments</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outlined" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* TAB 1: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div>
          {loading ? (
            <LoadingSpinner fullHeight label="Loading transactions..." />
          ) : payments.length === 0 ? (
            <EmptyState
              title="No Payments Recorded Yet"
              subtitle="Payments collected across loan installments will be tracked here with receipts, dates, and reference codes."
              icon={<Receipt className="h-8 w-8" />}
              actionText="Refresh"
              onAction={loadData}
            />
          ) : (
            <div className="space-y-2.5">
              {payments.map((p) => {
                const borrowerName = p.customers?.full_name || 'Borrower';
                const planTitle = p.payment_plans?.title || p.payment_plans?.plan_code || 'Loan';

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0F172A]">
                            {p.payment_reference}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            • {p.payment_method}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {borrowerName} • <span className="text-slate-400">{planTitle}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(p.payment_date || p.created_at)}
                          {p.notes ? ` • ${p.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center justify-between sm:justify-end gap-3 sm:border-t-0 pt-2 sm:pt-0 border-t border-slate-100">
                      <div>
                        <div className="text-base font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">Received</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Search bar for loans */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search plan code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSpinner fullHeight label="Loading payment plans..." />
          ) : loans.length === 0 ? (
            <EmptyState
              title="No Payment Plans Found"
              subtitle="Originate loans to track weekly or monthly payment plans here."
              icon={<Layers className="h-8 w-8" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => setActiveLoanId(loan.id)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F172A]">{loan.plan_code}</span>
                        <Badge
                          variant={
                            loan.status === 'completed'
                              ? 'success'
                              : loan.status === 'active'
                              ? 'navy'
                              : 'neutral'
                          }
                        >
                          {loan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        {loan.customer_name || 'Borrower'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-[#1E3A8A]">
                        {formatCurrency(loan.total_amount)}
                      </span>
                      <span className="text-[11px] text-slate-400 block capitalize">
                        {loan.frequency} ({loan.total_installments} periods)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Collected: {formatCurrency(loan.amount_collected || 0)}</span>
                      <span className="font-bold text-emerald-600">
                        {Math.round((loan.progress || 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.round((loan.progress || 0) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      {formatDate(loan.start_date)} - {formatDate(loan.end_date)}
                    </span>
                    <span className="flex items-center gap-1 text-[#1E3A8A] font-semibold">
                      View Schedule <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSTALLMENTS */}
      {activeTab === 'installments' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold inline-flex">
            {(['all', 'pending', 'overdue', 'paid'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setInstallmentStatus(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  installmentStatus === st
                    ? 'bg-white text-[#1E3A8A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingSpinner fullHeight label="Loading installments..." />
          ) : installments.length === 0 ? (
            <EmptyState
              title="No Installments Match Filter"
              subtitle="All scheduled installments are settled or none match your filter."
              icon={<CalendarDays className="h-8 w-8" />}
            />
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Borrower & Plan</th>
                      <th className="px-3 py-3.5">Period</th>
                      <th className="px-3 py-3.5">Due Date</th>
                      <th className="px-3 py-3.5 text-right">Amount Due</th>
                      <th className="px-3 py-3.5 text-right">Collected</th>
                      <th className="px-3 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {installments.map((inst) => {
                      const isSettled = inst.status === 'paid';
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-[#0F172A] block text-sm">
                              {inst.customer_name || 'Borrower'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {inst.plan_code || 'Loan'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-700">
                            {inst.period_label}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                            {formatDate(inst.due_date)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right font-bold text-slate-900">
                            {formatCurrency(inst.amount_due)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right font-semibold text-emerald-600">
                            {formatCurrency(inst.amount_paid)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <Badge
                              size="sm"
                              variant={
                                inst.status === 'paid'
                                  ? 'success'
                                  : inst.status === 'overdue'
                                  ? 'error'
                                  : inst.status === 'partially_paid'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {inst.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isSettled ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    className="text-[11px] py-1 px-2.5"
                                    onClick={() => {
                                      setSelectedInstallment(inst);
                                      setIsRecordPaymentOpen(true);
                                    }}
                                  >
                                    Collect
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedInstallment(inst);
                                      setIsEditInstallmentOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                    title="Edit installment"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        onSuccess={loadData}
      />

      {/* Edit Installment Modal */}
      <EditInstallmentModal
        isOpen={isEditInstallmentOpen}
        onClose={() => {
          setIsEditInstallmentOpen(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        onSuccess={loadData}
      />

      {/* Loan Details Modal */}
      <LoanDetailsModal
        isOpen={Boolean(activeLoanId)}
        onClose={() => {
          setActiveLoanId(null);
          onClearSelectedLoan?.();
        }}
        loanId={activeLoanId}
        onUpdated={loadData}
      />
    </div>
  );
};

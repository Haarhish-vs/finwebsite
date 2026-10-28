import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RecordPaymentModal } from './RecordPaymentModal';
import { EditInstallmentModal } from './EditInstallmentModal';
import { loanApi } from '../../api/loans';
import type { Loan, Installment } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  CreditCard,
  CheckCircle2,
  Edit2,
} from 'lucide-react';

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  onUpdated: () => void;
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  isOpen,
  onClose,
  loanId,
  onUpdated,
}) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Installment modals
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isEditInstallmentOpen, setIsEditInstallmentOpen] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    if (!loanId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loanApi.getLoanById(loanId);
      setLoan(data.loan);
      setInstallments(data.installments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load loan plan details.');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetails();
    }
  }, [isOpen, loanId, fetchLoanDetails]);

  if (!isOpen || !loanId) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={loan ? loan.title || loan.plan_code : 'Loan Details'}
        subtitle={loan ? `Plan Code: ${loan.plan_code}` : 'Loading...'}
        maxWidth="3xl"
      >
        {loading ? (
          <LoadingSpinner fullHeight label="Loading loan breakdown & schedule..." />
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 text-red-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outlined" onClick={fetchLoanDetails}>
              Retry
            </Button>
          </div>
        ) : loan ? (
          <div className="space-y-5">
            {/* Executive Metrics Bar */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center font-bold text-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0F172A]">{loan.customer_name || 'Borrower'}</h4>
                    <p className="text-xs text-slate-500">
                      {loan.frequency.toUpperCase()} Plan • {loan.total_installments} Installments
                    </p>
                  </div>
                </div>

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

              {/* 4 Financial KPI Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block">Total Repayment</span>
                  <span className="text-base font-bold text-[#0F172A]">
                    {formatCurrency(loan.total_amount)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <span className="text-emerald-700 block font-medium">Collected</span>
                  <span className="text-base font-bold text-emerald-800">
                    {formatCurrency(loan.amount_collected || 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <span className="text-blue-700 block font-medium">Outstanding</span>
                  <span className="text-base font-bold text-blue-900">
                    {formatCurrency(loan.outstanding_balance || 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block">Progress</span>
                  <span className="text-base font-bold text-emerald-600">
                    {Math.round((loan.progress || 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((loan.progress || 0) * 100))}%` }}
                />
              </div>

              {/* Loan Terms Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block">Principal:</span>
                  <span className="font-semibold">{formatCurrency(loan.principal_amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Monthly Rate:</span>
                  <span className="font-semibold">{loan.interest_rate}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Start Date:</span>
                  <span className="font-semibold">{formatDate(loan.start_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Maturity Date:</span>
                  <span className="font-semibold">{formatDate(loan.end_date)}</span>
                </div>
              </div>
            </div>

            {/* Repayment Schedule Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Repayment Schedule ({installments.length} Installments)
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Period</th>
                      <th className="px-3 py-2.5">Due Date</th>
                      <th className="px-3 py-2.5 text-right">Due (₹)</th>
                      <th className="px-3 py-2.5 text-right">Paid (₹)</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {installments.map((inst) => {
                      const isSettled = inst.status === 'paid';
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-slate-400">
                            {inst.installment_number}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800">
                            {inst.period_label}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {formatDate(inst.due_date)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                            {formatCurrency(inst.amount_due)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">
                            {formatCurrency(inst.amount_paid)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
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
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isSettled ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    className="text-[11px] py-1 px-2"
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
                                    title="Edit installment date/amount"
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
          </div>
        ) : null}
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        onSuccess={() => {
          fetchLoanDetails();
          onUpdated();
        }}
      />

      {/* Edit Installment Modal */}
      <EditInstallmentModal
        isOpen={isEditInstallmentOpen}
        onClose={() => {
          setIsEditInstallmentOpen(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        onSuccess={() => {
          fetchLoanDetails();
          onUpdated();
        }}
      />
    </>
  );
};

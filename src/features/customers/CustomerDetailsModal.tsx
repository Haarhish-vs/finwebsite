import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { customerApi } from '../../api/customers';
import { installmentApi } from '../../api/installments';
import { paymentApi } from '../../api/payments';
import type { Customer, Loan, Installment, Payment } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate, formatDateTime } from '../../utils/date';
import {
  Phone,
  Mail,
  Home,
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (customer: Customer) => void;
  onOriginateLoan: (customer: Customer) => void;
  onCustomerUpdated: () => void;
  onCustomerDeleted: () => void;
  onViewLoan?: (loanId: string) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
  onOriginateLoan,
  onCustomerUpdated,
  onCustomerDeleted,
  onViewLoan,
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'installments' | 'payments'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status toggle & Delete confirm states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomerData = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    try {
      const [loansData, instData, payData] = await Promise.all([
        customerApi.getCustomerLoans(customer.id),
        installmentApi.getInstallments({ customerId: customer.id, limit: 100 }),
        paymentApi.getPayments({ customer_id: customer.id, limit: 50 }),
      ]);
      setLoans(loansData || []);
      setInstallments(instData.installments || []);
      setPayments(payData.payments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer activity.');
    } finally {
      setLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen && customer) {
      loadCustomerData();
    }
  }, [isOpen, customer, loadCustomerData]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = customer.status === 'active' ? 'inactive' : 'active';
      await customerApi.updateCustomerStatus(customer.id, newStatus);
      onCustomerUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update customer status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    setIsDeleting(true);
    try {
      await customerApi.deleteCustomer(customer.id);
      setShowDeleteConfirm(false);
      onCustomerDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!customer) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={customer.full_name}
        subtitle={`Customer Details & Financial Ledger`}
        maxWidth="3xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Customer Profile Summary Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center font-bold text-lg">
                  {customer.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#0F172A]">{customer.full_name}</h4>
                    <Badge variant={customer.status === 'active' ? 'success' : 'neutral'}>
                      {customer.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Member since {formatDate(customer.created_at)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onClose();
                    onOriginateLoan(customer);
                  }}
                  icon={<PlusCircle className="h-3.5 w-3.5" />}
                >
                  Originate Loan
                </Button>
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={() => {
                    onClose();
                    onEdit(customer);
                  }}
                  icon={<Edit className="h-3.5 w-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleToggleStatus}
                  loading={isUpdatingStatus}
                >
                  {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Profile Field Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium">
                  {customer.phone || 'No phone'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium truncate">
                  {customer.email || 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium truncate">
                  {customer.address || 'No address'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 text-xs">₹</span>
                <span className="text-slate-600 font-medium">
                  Initial: {formatCurrency(customer.initial_amount_collected)}
                </span>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>{customer.notes}</span>
              </div>
            )}
          </div>

          {/* Ledger Navigation Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-6 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('loans')}
                className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'loans'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Loans ({loans.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('installments')}
                className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'installments'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Installment Schedule ({installments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Payment Receipts ({payments.length})
              </button>
            </nav>
          </div>

          {/* Ledger Tab Contents */}
          {loading ? (
            <LoadingSpinner label="Loading customer records..." />
          ) : (
            <div className="min-h-[220px]">
              {/* TAB 1: LOANS */}
              {activeTab === 'loans' && (
                <div className="space-y-3">
                  {loans.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No loan plans originated for this borrower yet.
                    </div>
                  ) : (
                    loans.map((loan) => (
                      <div
                        key={loan.id}
                        className="rounded-xl border border-slate-200 p-3.5 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all cursor-pointer"
                        onClick={() => onViewLoan?.(loan.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0F172A]">
                              {loan.plan_code}
                            </span>
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
                            <span className="text-xs text-slate-400 capitalize">
                              • {loan.frequency} ({loan.total_installments} periods)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Start: {formatDate(loan.start_date)} • End: {formatDate(loan.end_date)}
                          </p>
                        </div>

                        {/* Financial Metrics & Progress */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-sm font-bold text-[#1E3A8A]">
                              {formatCurrency(loan.total_amount)}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-semibold">
                              {formatCurrency(loan.amount_collected || 0)} collected
                            </div>
                          </div>
                          {loan.progress !== undefined && (
                            <div className="w-16">
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, Math.round(loan.progress * 100))}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold block mt-0.5 text-center">
                                {Math.round(loan.progress * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: INSTALLMENT SCHEDULE */}
              {activeTab === 'installments' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Due Date</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Due (₹)</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Paid (₹)</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {installments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                            No installments found.
                          </td>
                        </tr>
                      ) : (
                        installments.map((inst) => (
                          <tr key={inst.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400 font-medium">
                              {inst.installment_number}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-700">
                              {formatDate(inst.due_date)}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">
                              {formatCurrency(inst.amount_due)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                              {formatCurrency(inst.amount_paid)}
                            </td>
                            <td className="px-3 py-2 text-center">
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-2">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No payment receipts recorded for this customer yet.
                    </div>
                  ) : (
                    payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[#0F172A] block">
                              {p.payment_reference}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {formatDateTime(p.payment_date || p.created_at)} •{' '}
                              <span className="uppercase font-semibold">{p.payment_method}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog for Permanent Customer Deletion */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Customer Permanently?"
        isDestructive
        loading={isDeleting}
        confirmText="Delete Customer"
        message={
          <>
            Are you sure you want to permanently delete <strong>{customer.full_name}</strong>?
            <br />
            <br />
            This action will cascade delete all associated payment plans, installment schedules,
            and payment receipts. <strong>This cannot be undone.</strong>
          </>
        }
      />
    </>
  );
};

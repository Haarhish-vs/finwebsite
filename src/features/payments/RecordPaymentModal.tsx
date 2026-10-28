import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { installmentApi } from '../../api/installments';
import type { Installment } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { formatDate, toInputDateFormat } from '../../utils/date';
import { CheckCircle2, AlertCircle, Calendar, Hash } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => toInputDateFormat(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (installment && isOpen) {
      const remaining = Math.max(0, installment.amount_due - installment.amount_paid);
      setAmount(String(remaining.toFixed(2)));
      setPaymentDate(toInputDateFormat(new Date()));
      setPaymentMethod('cash');
      setReference(`RCP-${Date.now().toString().slice(-8)}`);
      setNotes(`Settlement for installment #${installment.installment_number}`);
      setError(null);
    }
  }, [installment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installment) return;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await installmentApi.recordPayment(installment.id, {
        amount: amt,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        payment_reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!installment) return null;

  const currentPaid = installment.amount_paid || 0;
  const currentDue = installment.amount_due || 0;
  const remaining = Math.max(0, currentDue - currentPaid);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Installment Payment"
      subtitle={`${installment.customer_name || 'Borrower'} • ${installment.period_label || `Installment #${installment.installment_number}`}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Installment Summary Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Plan Reference</span>
            <span className="font-bold text-[#1E3A8A]">{installment.plan_code || 'Loan'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Scheduled Due Date</span>
            <span className="font-semibold text-slate-800">{formatDate(installment.due_date)}</span>
          </div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Total Amount Due</span>
            <span className="font-bold text-slate-700">{formatCurrency(currentDue)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Already Paid</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(currentPaid)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold pt-1 border-t border-slate-200">
            <span className="text-[#0F172A]">Outstanding Balance</span>
            <span className="text-emerald-700">{formatCurrency(remaining)}</span>
          </div>
        </div>

        {/* Payment Amount Input */}
        <Input
          label="Payment Amount Received (₹) *"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefixIcon={<span className="font-bold text-xs">₹</span>}
          helperText={`Enter full ${formatCurrency(remaining)} or a partial amount.`}
          required
        />

        {/* Payment Date & Method Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            prefixIcon={<Calendar className="h-4 w-4" />}
          />
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] text-sm py-2 px-3 text-[#0F172A] bg-white focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Reference & Notes */}
        <Input
          label="Receipt Reference Code"
          placeholder="e.g. RCP-12345678"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          prefixIcon={<Hash className="h-4 w-4" />}
        />

        <Input
          label="Notes / Description"
          placeholder="e.g. Received via GPay from borrower"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

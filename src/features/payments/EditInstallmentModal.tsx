import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { installmentApi } from '../../api/installments';
import type { Installment } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { AlertCircle, Calendar } from 'lucide-react';

interface EditInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  onSuccess: () => void;
}

export const EditInstallmentModal: React.FC<EditInstallmentModalProps> = ({
  isOpen,
  onClose,
  installment,
  onSuccess,
}) => {
  const [dueDate, setDueDate] = useState<string>('');
  const [amountDue, setAmountDue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (installment && isOpen) {
      setDueDate(installment.due_date || '');
      setAmountDue(String(installment.amount_due));
      setError(null);
    }
  }, [installment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installment) return;

    const amt = parseFloat(amountDue);
    if (isNaN(amt) || amt <= 0) {
      setError('Amount due must be greater than 0.');
      return;
    }
    if (installment.amount_paid > amt) {
      setError(`Amount due cannot be less than already collected amount (${formatCurrency(installment.amount_paid)}).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await installmentApi.updateInstallment(installment.id, {
        due_date: dueDate || undefined,
        amount_due: amt,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update installment.');
    } finally {
      setLoading(false);
    }
  };

  if (!installment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${installment.period_label || `Installment #${installment.installment_number}`}`}
      subtitle={`${installment.customer_name || 'Borrower'} • Plan: ${installment.plan_code || 'Loan'}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <Input
          label="Scheduled Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          prefixIcon={<Calendar className="h-4 w-4" />}
          required
        />

        <Input
          label="Amount Due (₹)"
          type="number"
          step="0.01"
          value={amountDue}
          onChange={(e) => setAmountDue(e.target.value)}
          prefixIcon={<span className="font-bold text-xs">₹</span>}
          helperText={`Already paid: ${formatCurrency(installment.amount_paid)}`}
          required
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

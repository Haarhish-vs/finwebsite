import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { loanApi } from '../../api/loans';
import { customerApi } from '../../api/customers';
import type { Customer, LoanPreviewResponse } from '../../api/types';
import { formatCurrency } from '../../utils/currency';
import { toInputDateFormat } from '../../utils/date';
import { calculateLoanClient } from '../../utils/loanCalculator';
import {
  User,
  Phone,
  Calendar,
  Percent,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Edit2,
  CalendarDays,
  Layers,
} from 'lucide-react';

interface OriginateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCustomer?: Customer | null;
}

interface EditableInstallment {
  installment_number: number;
  period_label: string;
  due_date: string;
  amount_due: number;
}

export const OriginateLoanModal: React.FC<OriginateLoanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomer,
}) => {
  // Step 0: Customer & Loan Parameters, Step 1: Schedule Review & Edit
  const [currentStep, setCurrentStep] = useState<0 | 1>(0);

  // Form State
  const [customerId, setCustomerId] = useState<string | null>(initialCustomer?.id || null);
  const [customerName, setCustomerName] = useState(initialCustomer?.full_name || '');
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [address, setAddress] = useState(initialCustomer?.address || '');

  // Customers for auto-complete/selection if needed
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);

  // Loan State
  const [principal, setPrincipal] = useState<string>('50000');
  const [interestRate, setInterestRate] = useState<string>('5.0');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [duration, setDuration] = useState<string>('10');
  const [startDate, setStartDate] = useState<string>(() => toInputDateFormat(new Date()));
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return toInputDateFormat(d);
  });
  const [notes, setNotes] = useState<string>('');

  // Schedule Review State
  const [previewData, setPreviewData] = useState<LoanPreviewResponse | null>(null);
  const [editableInstallments, setEditableInstallments] = useState<EditableInstallment[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editAmountVal, setEditAmountVal] = useState<string>('');

  // Status & Error
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or fill when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setErrorMessage(null);
      if (initialCustomer) {
        setCustomerId(initialCustomer.id);
        setCustomerName(initialCustomer.full_name);
        setPhone(initialCustomer.phone || '');
        setEmail(initialCustomer.email || '');
        setAddress(initialCustomer.address || '');
      } else {
        setCustomerId(null);
        setCustomerName('');
        setPhone('');
        setEmail('');
        setAddress('');
      }
      // Load existing customers for selection
      customerApi
        .getCustomers({ limit: 50 })
        .then((res) => setExistingCustomers(res.customers || []))
        .catch(() => {});
    }
  }, [isOpen, initialCustomer]);

  // Recalculate default first due date when start date or frequency changes
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    try {
      const d = new Date(newStart);
      if (frequency === 'weekly') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      setFirstDueDate(toInputDateFormat(d));
    } catch {
      // ignore
    }
  };

  const handleFrequencyChange = (newFreq: 'monthly' | 'weekly') => {
    setFrequency(newFreq);
    try {
      const d = new Date(startDate);
      if (newFreq === 'weekly') {
        d.setDate(d.getDate() + 7);
        if (duration === '10') setDuration('24'); // sensible default for weeks
      } else {
        d.setMonth(d.getMonth() + 1);
        if (duration === '24') setDuration('10');
      }
      setFirstDueDate(toInputDateFormat(d));
    } catch {
      // ignore
    }
  };

  // Instant client calculation for preview card
  const clientCalc = calculateLoanClient({
    principal: parseFloat(principal) || 0,
    interestRate: parseFloat(interestRate) || 0,
    frequency,
    totalInstallments: parseInt(duration, 10) || 0,
    startDate,
    firstDueDate,
  });

  // Proceed to Step 2: Fetch authoritative schedule from backend /loans/preview
  const handleProceedToSchedule = async () => {
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }
    const p = parseFloat(principal);
    if (isNaN(p) || p <= 0) {
      setErrorMessage('Principal loan amount must be greater than 0.');
      return;
    }
    const r = parseFloat(interestRate);
    if (isNaN(r) || r < 0) {
      setErrorMessage('Interest rate must be a non-negative number.');
      return;
    }
    const n = parseInt(duration, 10);
    if (isNaN(n) || n <= 0) {
      setErrorMessage('Duration must be a positive integer.');
      return;
    }

    setIsCalculating(true);
    try {
      const preview = await loanApi.previewLoan({
        principal: p,
        interest_rate: r,
        frequency,
        total_installments: n,
        start_date: startDate,
        first_due_date: firstDueDate,
      });

      setPreviewData(preview);
      setEditableInstallments(
        preview.installments.map((inst) => ({
          installment_number: inst.installment_number,
          period_label: inst.period_label,
          due_date: inst.due_date,
          amount_due: inst.amount_due,
        }))
      );
      setCurrentStep(1);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate schedule preview.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle individual installment date edit
  const handleInstallmentDateChange = (index: number, newDate: string) => {
    setEditableInstallments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], due_date: newDate };
      return next;
    });
  };

  // Handle individual installment amount edit
  const startEditAmount = (index: number) => {
    setEditingIndex(index);
    setEditAmountVal(String(editableInstallments[index].amount_due));
  };

  const saveEditAmount = (index: number) => {
    const val = parseFloat(editAmountVal);
    if (!isNaN(val) && val >= 0) {
      setEditableInstallments((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], amount_due: Math.round(val * 100) / 100 };
        return next;
      });
    }
    setEditingIndex(null);
  };

  // Total calculated from editable installments
  const revisedTotal = editableInstallments.reduce((sum, item) => sum + item.amount_due, 0);
  const targetTotal = previewData?.summary.totalRepayment || clientCalc.totalRepayment;
  const isReconciled = Math.abs(revisedTotal - targetTotal) < 0.05;

  // Final Confirmation: Call POST /api/v1/loans
  const handleConfirmAndDisburse = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const clientRequestId = `LN-${Date.now()}`;

    try {
      await loanApi.createLoan({
        idempotency_key: clientRequestId,
        plan_code: clientRequestId,
        customer_id: customerId || undefined,
        customer_name: customerName.trim(),
        name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        principal: parseFloat(principal),
        interest_rate: parseFloat(interestRate),
        frequency,
        total_installments: parseInt(duration, 10),
        start_date: startDate,
        first_due_date: firstDueDate,
        notes: notes.trim() || undefined,
        custom_installments: editableInstallments.map((i) => ({
          installment_number: i.installment_number,
          due_date: i.due_date,
          amount_due: i.amount_due,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to originate loan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        currentStep === 0
          ? 'Add Customer & Originate Loan'
          : 'Review & Edit Installment Schedule'
      }
      subtitle={
        currentStep === 0
          ? 'Step 1 of 2: Borrower details & loan calculation'
          : 'Step 2 of 2: Confirm installment dates & amounts'
      }
      maxWidth={currentStep === 0 ? '2xl' : '3xl'}
    >
      <div className="space-y-4">
        {/* Error Alert Box */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* STEP 0: Borrower Details & Loan Calculation */}
        {currentStep === 0 && (
          <div className="space-y-5">
            {/* 1. Borrower Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
                  <User className="h-4 w-4" />
                  <span>1. Customer Information</span>
                </div>
                {existingCustomers.length > 0 && !initialCustomer && (
                  <select
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white"
                    onChange={(e) => {
                      const sel = existingCustomers.find((c) => c.id === e.target.value);
                      if (sel) {
                        setCustomerId(sel.id);
                        setCustomerName(sel.full_name);
                        setPhone(sel.phone || '');
                        setEmail(sel.email || '');
                        setAddress(sel.address || '');
                      } else {
                        setCustomerId(null);
                        setCustomerName('');
                        setPhone('');
                      }
                    }}
                  >
                    <option value="">Select Existing Customer (Optional)</option>
                    {existingCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Customer Name *"
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  prefixIcon={<User className="h-4 w-4" />}
                />
                <Input
                  label="Phone Number *"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  prefixIcon={<Phone className="h-4 w-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email (Optional)"
                  placeholder="ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Residential Address (Optional)"
                  placeholder="Door No, Street, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Loan Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
                <Layers className="h-4 w-4" />
                <span>2. Loan Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Principal Amount (₹) *"
                  type="number"
                  placeholder="50000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  prefixIcon={<span className="font-bold text-xs">₹</span>}
                />
                <div>
                  <Input
                    label="Monthly Interest Rate (%) *"
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    prefixIcon={<Percent className="h-3.5 w-3.5" />}
                    helperText="e.g. 5 = 5% per month (5 paisa vatti)"
                  />
                </div>
              </div>

              {/* Repayment Frequency Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Payment Frequency
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('monthly')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      frequency === 'monthly'
                        ? 'bg-white text-[#1E3A8A] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Monthly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('weekly')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      frequency === 'weekly'
                        ? 'bg-white text-[#1E3A8A] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Weekly</span>
                  </button>
                </div>
              </div>

              {/* Duration and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label={
                    frequency === 'weekly'
                      ? 'Duration (Weeks) *'
                      : 'Duration (Months) *'
                  }
                  type="number"
                  placeholder={frequency === 'weekly' ? '24' : '10'}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  prefixIcon={<Clock className="h-4 w-4" />}
                />
                <Input
                  label="Loan Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
                <Input
                  label="First Due Date"
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  helperText={frequency === 'weekly' ? '1 week offset' : '1 month offset'}
                />
              </div>

              <Input
                label="Loan Notes / Memo (Optional)"
                placeholder="e.g. Gold security, Guarantor details, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* 3. Live Loan Calculation Preview Card (Exact Flutter UI match) */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="bg-[#1E3A8A]/5 border-b border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Total Repayment
                  </span>
                  <div className="text-xl font-bold text-emerald-600">
                    {formatCurrency(clientCalc.totalRepayment)}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    {frequency === 'weekly' ? 'Weekly Due' : 'Monthly Due'}
                  </span>
                  <div className="text-xl font-bold text-[#1E3A8A]">
                    {formatCurrency(clientCalc.baseInstallment)}
                  </div>
                </div>
              </div>

              <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[#64748B] block">Principal</span>
                  <span className="font-bold text-[#0F172A]">
                    {formatCurrency(clientCalc.principal)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Monthly Rate</span>
                  <span className="font-bold text-[#0F172A]">
                    {clientCalc.monthlyInterestRate}% / mo
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Total Interest</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(clientCalc.totalInterest)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Tenure</span>
                  <span className="font-bold text-[#0F172A]">
                    {clientCalc.totalInstallments}{' '}
                    {frequency === 'weekly' ? 'Weeks' : 'Months'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleProceedToSchedule}
                loading={isCalculating}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Review Schedule
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: Review & Edit Schedule */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Reconciliation Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isReconciled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>
                  {isReconciled
                    ? 'Schedule is fully reconciled with total expected repayment.'
                    : `Schedule sum (${formatCurrency(
                        revisedTotal
                      )}) differs from target total (${formatCurrency(targetTotal)}).`}
                </span>
              </div>
              <div className="font-bold text-sm">
                Sum: {formatCurrency(revisedTotal)}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              You can adjust due dates or custom installment amounts for individual periods
              before disbursing. Click the pencil icon to edit an amount.
            </p>

            {/* Installments Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Period</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Due Date</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Amount Due (₹)
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {editableInstallments.map((inst, idx) => (
                    <tr key={inst.installment_number} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 font-medium">
                        {inst.installment_number}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {inst.period_label}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={inst.due_date}
                          onChange={(e) =>
                            handleInstallmentDateChange(idx, e.target.value)
                          }
                          className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-700 bg-white"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#1E3A8A]">
                        {editingIndex === idx ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editAmountVal}
                              onChange={(e) => setEditAmountVal(e.target.value)}
                              className="w-24 px-1.5 py-0.5 border border-blue-400 rounded text-right text-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => saveEditAmount(idx)}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-medium"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span>{formatCurrency(inst.amount_due)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {editingIndex !== idx && (
                          <button
                            type="button"
                            onClick={() => startEditAmount(idx)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Edit amount"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setCurrentStep(0)}
                icon={<ArrowLeft className="h-4 w-4" />}
                disabled={isSubmitting}
              >
                Back to Details
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmAndDisburse}
                  loading={isSubmitting}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Confirm & Originate Loan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

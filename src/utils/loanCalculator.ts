/**
 * Client Loan Calculator Utility
 * Exactly mirrors backend/src/utils/loan-calculator.js
 */

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

export const WEEKDAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const WEEKDAY_NAMES: readonly string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function parseWeekday(dayStr?: string | null): { name: string; dayIndex: number } | null {
  if (!dayStr || typeof dayStr !== 'string') return null;
  const key = dayStr.trim().toLowerCase();
  if (WEEKDAYS_MAP[key] !== undefined) {
    const dayIndex = WEEKDAYS_MAP[key];
    return { name: WEEKDAY_NAMES[dayIndex], dayIndex };
  }
  return null;
}

export function computeFirstDueDateForWeekday(startDate: Date | string, targetDayIndex: number): Date {
  const d = new Date(startDate);
  // Using UTC day to match backend standard
  const currentDay = d.getUTCDay();
  let diff = targetDayIndex - currentDay;
  if (diff <= 0) {
    diff += 7;
  }
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function weeksToMonths(weeks: number): number {
  return Number(((weeks * MONTHS_PER_YEAR) / WEEKS_PER_YEAR).toFixed(6));
}

export function roundToTwo(num: number): number {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

export interface ClientLoanCalculation {
  principal: number;
  monthlyInterestRate: number;
  frequency: 'weekly' | 'monthly';
  paymentDay?: string | null;
  totalInstallments: number;
  durationInMonths: number;
  monthlyInterest: number;
  totalInterest: number;
  totalRepayment: number;
  baseInstallment: number;
  finalInstallmentAdjustment: number;
  regularInstallmentAmount: number;
  startDate: string;
  firstDueDate: string;
  finalDueDate: string;
}

export interface ClientInstallmentItem {
  installment_number: number;
  period_label: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
}

export function computeWeeklyDate(baseDate: Date, weekOffset: number): string {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + weekOffset * 7);
  return d.toISOString().split('T')[0];
}

export function computeMonthlyDate(baseDate: Date, monthOffset: number, anchorDay: number | null = null): string {
  const original = new Date(baseDate);
  const targetYear = original.getUTCFullYear();
  const targetMonth = original.getUTCMonth() + monthOffset;
  const dayToUse = anchorDay || original.getUTCDate();

  const target = new Date(Date.UTC(targetYear, targetMonth, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const safeDay = Math.min(dayToUse, lastDay);
  target.setUTCDate(safeDay);

  return target.toISOString().split('T')[0];
}

export function computeDefaultFirstDueDate(startDate: Date, isWeekly: boolean, paymentDay?: string | null): Date {
  const d = new Date(startDate);
  if (isWeekly) {
    const parsed = parseWeekday(paymentDay);
    if (parsed) {
      return computeFirstDueDateForWeekday(startDate, parsed.dayIndex);
    }
    d.setUTCDate(d.getUTCDate() + 7);
  } else {
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d;
}

export function calculateLoanClient({
  principal,
  interestRate,
  frequency = 'monthly',
  paymentDay,
  totalInstallments,
  startDate,
  firstDueDate,
}: {
  principal: number;
  interestRate: number;
  frequency: 'weekly' | 'monthly';
  paymentDay?: string | null;
  totalInstallments: number;
  startDate?: string;
  firstDueDate?: string;
}): ClientLoanCalculation {
  const p = roundToTwo(principal || 0);
  const r = Number(interestRate || 0);
  const n = parseInt(String(totalInstallments), 10) || 0;

  const isWeekly = frequency === 'weekly';
  const durationInMonths = n > 0 ? (isWeekly ? weeksToMonths(n) : n) : 0;

  const monthlyInterest = roundToTwo(p * (r / 100));
  const totalInterest = roundToTwo(p * (r / 100) * durationInMonths);
  const totalRepayment = roundToTwo(p + totalInterest);

  const baseInstallment = n > 0 ? Math.floor((totalRepayment / n) * 100) / 100 : 0;
  const roundingDiff = n > 0 ? roundToTwo(totalRepayment - baseInstallment * n) : 0;

  const start = startDate ? new Date(startDate) : new Date();
  const firstDue = firstDueDate
    ? new Date(firstDueDate)
    : computeDefaultFirstDueDate(start, isWeekly, paymentDay);

  const finalDueDate =
    n > 0
      ? isWeekly
        ? computeWeeklyDate(firstDue, n - 1)
        : computeMonthlyDate(firstDue, n - 1, firstDue.getUTCDate())
      : firstDue.toISOString().split('T')[0];

  return {
    principal: p,
    monthlyInterestRate: r,
    frequency,
    paymentDay: isWeekly ? (parseWeekday(paymentDay)?.name || null) : null,
    totalInstallments: n,
    durationInMonths: roundToTwo(durationInMonths),
    monthlyInterest,
    totalInterest,
    totalRepayment,
    baseInstallment,
    finalInstallmentAdjustment: roundingDiff,
    regularInstallmentAmount: baseInstallment,
    startDate: start.toISOString().split('T')[0],
    firstDueDate: firstDue.toISOString().split('T')[0],
    finalDueDate,
  };
}

export function generateClientSchedule(calculation: ClientLoanCalculation): ClientInstallmentItem[] {
  const installments: ClientInstallmentItem[] = [];
  const isWeekly = calculation.frequency === 'weekly';
  const firstDue = new Date(calculation.firstDueDate);
  const anchorDay = firstDue.getUTCDate();
  let accumulatedDue = 0;

  for (let i = 1; i <= calculation.totalInstallments; i++) {
    const dueDate = isWeekly
      ? computeWeeklyDate(firstDue, i - 1)
      : computeMonthlyDate(firstDue, i - 1, anchorDay);

    let amountDue: number;
    if (i === calculation.totalInstallments) {
      amountDue = roundToTwo(calculation.totalRepayment - accumulatedDue);
    } else {
      amountDue = calculation.baseInstallment;
    }
    accumulatedDue = roundToTwo(accumulatedDue + amountDue);

    installments.push({
      installment_number: i,
      period_label: isWeekly ? `Week ${i}` : `Month ${i}`,
      due_date: dueDate,
      amount_due: amountDue,
      amount_paid: 0,
      outstanding_balance: amountDue,
      status: 'pending',
    });
  }

  return installments;
}

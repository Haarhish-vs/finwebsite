/**
 * Client Loan Calculator Utility
 * Exactly mirrors backend/src/utils/loan-calculator.js
 */

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

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

export function computeWeeklyDate(baseDate: Date, weekOffset: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + weekOffset * 7);
  return d.toISOString().split('T')[0];
}

export function computeMonthlyDate(baseDate: Date, monthOffset: number, anchorDay: number | null = null): string {
  const original = new Date(baseDate);
  const targetYear = original.getFullYear();
  const targetMonth = original.getMonth() + monthOffset;
  const dayToUse = anchorDay || original.getDate();

  const target = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(dayToUse, lastDay);
  target.setDate(safeDay);

  return target.toISOString().split('T')[0];
}

export function computeDefaultFirstDueDate(startDate: Date, isWeekly: boolean): Date {
  const d = new Date(startDate);
  if (isWeekly) {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export function calculateLoanClient({
  principal,
  interestRate,
  frequency = 'monthly',
  totalInstallments,
  startDate,
  firstDueDate,
}: {
  principal: number;
  interestRate: number;
  frequency: 'weekly' | 'monthly';
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
  const firstDue = firstDueDate ? new Date(firstDueDate) : computeDefaultFirstDueDate(start, isWeekly);

  const finalDueDate =
    n > 0
      ? isWeekly
        ? computeWeeklyDate(firstDue, n - 1)
        : computeMonthlyDate(firstDue, n - 1, firstDue.getDate())
      : firstDue.toISOString().split('T')[0];

  return {
    principal: p,
    monthlyInterestRate: r,
    frequency,
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

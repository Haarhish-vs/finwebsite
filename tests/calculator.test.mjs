import test from 'node:test';
import assert from 'node:assert/strict';

// Test loan calculation rules matching backend
function weeksToMonths(weeks) {
  return Number(((weeks * 12) / 52).toFixed(6));
}

function roundToTwo(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function calculateLoan({ principal, interestRate, frequency, totalInstallments }) {
  const p = roundToTwo(principal);
  const r = Number(interestRate);
  const n = parseInt(totalInstallments, 10);
  const isWeekly = frequency === 'weekly';
  const durationInMonths = isWeekly ? weeksToMonths(n) : n;

  const monthlyInterest = roundToTwo(p * (r / 100));
  const totalInterest = roundToTwo(p * (r / 100) * durationInMonths);
  const totalRepayment = roundToTwo(p + totalInterest);
  const baseInstallment = Math.floor((totalRepayment / n) * 100) / 100;
  const roundingDiff = roundToTwo(totalRepayment - (baseInstallment * n));

  return {
    principal: p,
    monthlyInterestRate: r,
    durationInMonths,
    monthlyInterest,
    totalInterest,
    totalRepayment,
    baseInstallment,
    finalInstallmentAdjustment: roundingDiff,
  };
}

test('Monthly loan simple interest calculation', () => {
  const calc = calculateLoan({
    principal: 50000,
    interestRate: 5,
    frequency: 'monthly',
    totalInstallments: 10,
  });

  assert.equal(calc.principal, 50000);
  assert.equal(calc.monthlyInterest, 2500);
  assert.equal(calc.totalInterest, 25000);
  assert.equal(calc.totalRepayment, 75000);
  assert.equal(calc.baseInstallment, 7500);
  assert.equal(calc.finalInstallmentAdjustment, 0);
});

test('Weekly loan duration and interest conversion (52 weeks = 12 months)', () => {
  const calc = calculateLoan({
    principal: 100000,
    interestRate: 10,
    frequency: 'weekly',
    totalInstallments: 25,
  });

  assert.equal(calc.principal, 100000);
  assert.equal(calc.monthlyInterest, 10000);
  // 25 * 12 / 52 = 5.769231 months
  // 100000 * 0.10 * 5.769231 = 57692.31
  assert.equal(calc.totalInterest, 57692.31);
  assert.equal(calc.totalRepayment, 157692.31);
});

test('Paise precision and final installment reconciliation', () => {
  const calc = calculateLoan({
    principal: 10000,
    interestRate: 3.5,
    frequency: 'monthly',
    totalInstallments: 3,
  });

  // Total interest: 10000 * 0.035 * 3 = 1050
  // Total repayment: 11050
  // 11050 / 3 = 3683.3333 -> baseInstallment = 3683.33
  // 3 * 3683.33 = 11049.99 -> adjustment = 0.01
  assert.equal(calc.totalRepayment, 11050);
  assert.equal(calc.baseInstallment, 3683.33);
  assert.equal(calc.finalInstallmentAdjustment, 0.01);
});


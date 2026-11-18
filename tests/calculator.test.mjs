import test from 'node:test';
import assert from 'node:assert/strict';

// Test loan calculation rules matching backend
const WEEKDAYS_MAP = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function parseWeekday(dayStr) {
  if (!dayStr || typeof dayStr !== 'string') return null;
  const key = dayStr.trim().toLowerCase();
  if (WEEKDAYS_MAP[key] !== undefined) {
    const dayIndex = WEEKDAYS_MAP[key];
    return { name: WEEKDAY_NAMES[dayIndex], dayIndex };
  }
  return null;
}

function computeFirstDueDateForWeekday(startDate, targetDayIndex) {
  const d = new Date(startDate);
  const currentDay = d.getUTCDay();
  let diff = targetDayIndex - currentDay;
  if (diff <= 0) {
    diff += 7;
  }
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function weeksToMonths(weeks) {
  return Number(((weeks * 12) / 52).toFixed(6));
}

function roundToTwo(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function calculateLoan({ principal, interestRate, frequency, totalInstallments, paymentDay, startDate }) {
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

  let firstDueDate;
  if (startDate) {
    if (isWeekly && paymentDay) {
      const parsed = parseWeekday(paymentDay);
      if (parsed) {
        firstDueDate = computeFirstDueDateForWeekday(startDate, parsed.dayIndex).toISOString().split('T')[0];
      }
    }
  }

  return {
    principal: p,
    monthlyInterestRate: r,
    durationInMonths,
    monthlyInterest,
    totalInterest,
    totalRepayment,
    baseInstallment,
    finalInstallmentAdjustment: roundingDiff,
    firstDueDate,
    isWeekly,
  };
}

function generateScheduleLabels(totalInstallments, isWeekly) {
  const labels = [];
  for (let i = 1; i <= totalInstallments; i++) {
    labels.push(isWeekly ? `Week ${i}` : `Month ${i}`);
  }
  return labels;
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

  assert.equal(calc.totalRepayment, 11050);
  assert.equal(calc.baseInstallment, 3683.33);
  assert.equal(calc.finalInstallmentAdjustment, 0.01);
});

test('Weekday parser correctly normalizes valid and invalid inputs', () => {
  assert.deepEqual(parseWeekday('Monday'), { name: 'Monday', dayIndex: 1 });
  assert.deepEqual(parseWeekday('wednesday'), { name: 'Wednesday', dayIndex: 3 });
  assert.deepEqual(parseWeekday('  SUNDAY  '), { name: 'Sunday', dayIndex: 0 });
  assert.equal(parseWeekday('funday'), null);
  assert.equal(parseWeekday(null), null);
});

test('Weekly loan aligns first due date to target weekday', () => {
  // 2026-11-18 is Wednesday (UTC day index 3)
  const calcMonday = calculateLoan({
    principal: 10000,
    interestRate: 2,
    frequency: 'weekly',
    totalInstallments: 4,
    paymentDay: 'Monday',
    startDate: '2026-11-18',
  });
  // Next Monday after Wednesday Nov 18 is Nov 23
  assert.equal(calcMonday.firstDueDate, '2026-11-23');

  const calcWednesday = calculateLoan({
    principal: 10000,
    interestRate: 2,
    frequency: 'weekly',
    totalInstallments: 4,
    paymentDay: 'Wednesday',
    startDate: '2026-11-18',
  });
  // Next Wednesday (+7 days) is Nov 25
  assert.equal(calcWednesday.firstDueDate, '2026-11-25');
});

test('Period labels strictly reflect frequency: Week 1..N vs Month 1..N', () => {
  const weeklyLabels = generateScheduleLabels(3, true);
  assert.deepEqual(weeklyLabels, ['Week 1', 'Week 2', 'Week 3']);

  const monthlyLabels = generateScheduleLabels(3, false);
  assert.deepEqual(monthlyLabels, ['Month 1', 'Month 2', 'Month 3']);
});

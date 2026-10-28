/**
 * Currency Formatter Utility
 * Formats monetary amounts in Indian Rupees (₹) with the en-IN locale
 */

export const CURRENCY_SYMBOL = '₹';

export function formatCurrency(amount: number | string | null | undefined, options?: { showDecimals?: boolean }): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;

  const showDecimals = options?.showDecimals ?? (num % 1 !== 0);

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num);

  return `${CURRENCY_SYMBOL}${formattedNumber}`;
}

export function formatCompactCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;

  if (Math.abs(num) >= 10000000) {
    return `${CURRENCY_SYMBOL}${(num / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `${CURRENCY_SYMBOL}${(num / 100000).toFixed(2)} L`;
  }
  if (Math.abs(num) >= 1000) {
    return `${CURRENCY_SYMBOL}${(num / 1000).toFixed(1)}k`;
  }

  return formatCurrency(num);
}

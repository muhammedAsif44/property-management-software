export function formatCurrency(amount: number | string): string {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export * from './utils/financial-math';

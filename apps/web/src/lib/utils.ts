export function formatCurrency(amount: number | string): string {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDisplayName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

export * from './utils/financial-math';

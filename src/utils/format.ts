const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number, opts?: { decimals?: boolean }) {
  return opts?.decimals ? inrFormatterDecimal.format(amount) : inrFormatter.format(amount);
}

export function formatCompactCurrency(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedCurrency(amount: number, type: 'expense' | 'income' | 'transfer') {
  const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : '';
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
}

const dayFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const dayYearFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

export function formatDay(date: string | Date) {
  return dayFormatter.format(new Date(date));
}

export function formatDayYear(date: string | Date) {
  return dayYearFormatter.format(new Date(date));
}

export function formatTime(date: string | Date) {
  return timeFormatter.format(new Date(date));
}

export function formatWeekday(date: string | Date) {
  return weekdayFormatter.format(new Date(date));
}

export function formatMonthYear(date: string | Date) {
  return monthFormatter.format(new Date(date));
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function relativeDayLabel(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return formatDay(d);
}

export function groupByDay<T>(items: T[], getDate: (item: T) => string): { title: string; data: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = new Date(getDate(item)).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([key, data]) => ({ title: relativeDayLabel(key), data }));
}

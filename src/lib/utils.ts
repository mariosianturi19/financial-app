export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

export function toInputDate(dateStr: string): string {
  return dateStr.substring(0, 10);
}

export function addMonths(yearMonth: string, n: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

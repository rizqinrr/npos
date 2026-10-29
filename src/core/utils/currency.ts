export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp))
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium'
  }).format(new Date(timestamp))
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeStyle: 'short'
  }).format(new Date(timestamp))
}

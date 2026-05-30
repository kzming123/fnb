import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: string | number,
  currency = 'MYR',
  locale = 'en-MY'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(
  dateStr: string,
  locale = 'en-MY',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(dateStr))
}

export function formatMonthYear(year: number, month: number, locale = 'en-MY'): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1)
  )
}

export function pct(numerator: string | number, denominator: string | number): number {
  const n = typeof numerator === 'string' ? parseFloat(numerator) : numerator
  const d = typeof denominator === 'string' ? parseFloat(denominator) : denominator
  if (d === 0) return 0
  return Math.round((n / d) * 1000) / 10
}

// Returns "YYYY-MM-DD" in the USER'S LOCAL timezone.
// Do NOT use new Date().toISOString() for date strings — that gives UTC,
// which is the previous calendar day for UTC+ timezones before midnight UTC.
export function localDateStr(d: Date = new Date()): string {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function todayISO(): string {
  return localDateStr()
}

export function subtractDays(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

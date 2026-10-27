import type { MetricFormat } from '@/lib/types'

/** Fixed reference time so mock data and relative dates render identically on server and client. */
export const MOCK_NOW = new Date('2026-10-27T09:30:00Z')

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const centsFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('en-US')

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatMetric(value: number, format: MetricFormat) {
  if (format === 'currency') return currencyFormatter.format(value)
  if (format === 'compact') return compactFormatter.format(value)
  return numberFormatter.format(value)
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCents(cents: number) {
  return centsFormatter.format(cents / 100)
}

export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatCompact(value: number) {
  return compactFormatter.format(value)
}

export function formatChange(change: number) {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return `${dateTimeFormatter.format(new Date(iso))} UTC`
}

const relativeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto', style: 'short' })

export function formatRelative(iso: string, now: Date = MOCK_NOW) {
  const diffSeconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const abs = Math.abs(diffSeconds)
  if (abs < 60) return 'just now'
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour')
  if (abs < 86400 * 30) return relativeFormatter.format(Math.round(diffSeconds / 86400), 'day')
  return formatDate(iso)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

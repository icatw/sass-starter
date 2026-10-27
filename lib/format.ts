import type { Locale } from '@/lib/i18n/config'
import type { MetricFormat } from '@/lib/types'

/** Fixed reference time so mock data and relative dates render identically on server and client. */
export const MOCK_NOW = new Date('2026-10-27T09:30:00Z')

export type Formatter = ReturnType<typeof createFormatter>

/** Locale-aware number, currency, and date formatting. All dates are rendered in UTC for SSR stability. */
export function createFormatter(locale: Locale) {
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const cents = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
  const compactCurrency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  const number = new Intl.NumberFormat(locale)
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
  const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const monthDay = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const monthYear = new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
  const dateTime = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })

  const formatDate = (iso: string) => date.format(new Date(iso))

  return {
    metric(value: number, format: MetricFormat) {
      if (format === 'currency') return currency.format(value)
      if (format === 'compact') return compact.format(value)
      return number.format(value)
    },
    currency: (value: number) => currency.format(value),
    compactCurrency: (value: number) => compactCurrency.format(value),
    cents: (value: number) => cents.format(value / 100),
    number: (value: number) => number.format(value),
    compact: (value: number) => compact.format(value),
    change(value: number) {
      const sign = value > 0 ? '+' : ''
      return `${sign}${value.toFixed(1)}%`
    },
    date: formatDate,
    monthDay: (iso: string) => monthDay.format(new Date(iso)),
    monthYear: (iso: string) => monthYear.format(new Date(iso)),
    dateTime: (iso: string) => `${dateTime.format(new Date(iso))} UTC`,
    relative(iso: string, now: Date = MOCK_NOW) {
      const diffSeconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
      const abs = Math.abs(diffSeconds)
      if (abs < 60) return relative.format(0, 'second')
      if (abs < 3600) return relative.format(Math.round(diffSeconds / 60), 'minute')
      if (abs < 86400) return relative.format(Math.round(diffSeconds / 3600), 'hour')
      if (abs < 86400 * 30) return relative.format(Math.round(diffSeconds / 86400), 'day')
      return formatDate(iso)
    },
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

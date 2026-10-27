'use client'

import useSWR from 'swr'
import {
  getJobSummary,
  getKpis,
  getNotifications,
  getOrders,
  getRegistrations,
  getRevenue,
  getSystemStatus,
} from '@/lib/api/overview'
import type { RevenueRange } from '@/lib/types'

export const swrKeys = {
  kpis: 'overview/kpis',
  revenue: (range: RevenueRange) => ['overview/revenue', range] as const,
  orders: 'billing/orders',
  registrations: 'users/registrations',
  jobs: 'jobs/summary',
  status: 'system/status',
  notifications: 'notifications',
}

export function useKpis() {
  return useSWR(swrKeys.kpis, getKpis)
}

export function useRevenue(range: RevenueRange) {
  return useSWR(swrKeys.revenue(range), ([, value]) => getRevenue(value), { keepPreviousData: true })
}

export function useOrders() {
  return useSWR(swrKeys.orders, getOrders)
}

export function useRegistrations() {
  return useSWR(swrKeys.registrations, getRegistrations)
}

export function useJobSummary() {
  return useSWR(swrKeys.jobs, getJobSummary)
}

export function useSystemStatus() {
  return useSWR(swrKeys.status, getSystemStatus)
}

export function useNotifications() {
  return useSWR(swrKeys.notifications, getNotifications)
}

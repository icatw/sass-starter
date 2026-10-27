import { ApiError } from '@/lib/api/errors'
import { MOCK_NOW } from '@/lib/format'
import {
  buildRevenueSeries,
  jobSummary,
  kpis,
  notifications,
  orders,
  recentRegistrations,
  systemStatus,
} from '@/lib/mock-data/overview'
import type {
  AppNotification,
  InviteUserInput,
  JobSummary,
  Kpi,
  Order,
  RevenueRange,
  RevenueSeries,
  SystemStatus,
  UserRegistration,
} from '@/lib/types'

/**
 * In-memory mock API. Each function mirrors an endpoint the Go business API will expose later,
 * so swapping to `fetch('/api/...')` only requires changing the function bodies.
 */

const LATENCY_MS = 450

function respond<T>(value: T, latency = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), latency))
}

function fail(error: ApiError, latency = LATENCY_MS): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), latency))
}

const db = {
  orders: structuredClone(orders),
  registrations: structuredClone(recentRegistrations),
  jobs: structuredClone(jobSummary),
  status: structuredClone(systemStatus),
  notifications: structuredClone(notifications),
}

export function getKpis(): Promise<Kpi[]> {
  return respond(kpis)
}

export function getRevenue(range: RevenueRange): Promise<RevenueSeries> {
  return respond(buildRevenueSeries(range), 350)
}

export function getOrders(): Promise<Order[]> {
  return respond(db.orders)
}

export function refundOrder(orderId: string): Promise<Order> {
  const order = db.orders.find((item) => item.id === orderId)
  if (!order) return fail(new ApiError('orderNotFound'))
  if (order.status !== 'paid') return fail(new ApiError('orderNotRefundable', { status: order.status }))
  order.status = 'refunded'
  return respond(order, 600)
}

export function getRegistrations(): Promise<UserRegistration[]> {
  return respond(db.registrations)
}

export function inviteUser(input: InviteUserInput): Promise<UserRegistration> {
  const email = input.email.trim().toLowerCase()
  const exists = db.registrations.some((user) => user.email.toLowerCase() === email)
  if (exists) return fail(new ApiError('userExists', { email }), 700)

  const user: UserRegistration = {
    id: `usr_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email,
    organization: input.organization.trim(),
    plan: 'Free',
    source: 'Referral',
    country: 'United States',
    createdAt: MOCK_NOW.toISOString(),
  }
  db.registrations = [user, ...db.registrations]
  return respond(user, 700)
}

export function getJobSummary(): Promise<JobSummary> {
  return respond(db.jobs)
}

export function retryFailedJobs(): Promise<JobSummary> {
  const retried = db.jobs.failedJobs.filter((job) => job.attempts < job.maxAttempts)
  if (retried.length === 0) return fail(new ApiError('noRetryableJobs'), 800)

  db.jobs = {
    ...db.jobs,
    failedJobs: db.jobs.failedJobs.filter((job) => job.attempts >= job.maxAttempts),
    queues: db.jobs.queues.map((queue) => {
      const count = retried.filter((job) => job.queue === queue.name).length
      return {
        ...queue,
        counts: {
          ...queue.counts,
          failed: Math.max(0, queue.counts.failed - count),
          queued: queue.counts.queued + count,
        },
      }
    }),
  }
  return respond(db.jobs, 800)
}

export function getSystemStatus(): Promise<SystemStatus> {
  db.status = { ...db.status, checkedAt: MOCK_NOW.toISOString() }
  return respond(db.status, 600)
}

export function getNotifications(): Promise<AppNotification[]> {
  return respond(db.notifications, 200)
}

export function markNotificationsRead(ids: string[]): Promise<AppNotification[]> {
  db.notifications = db.notifications.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item))
  return respond(db.notifications, 150)
}

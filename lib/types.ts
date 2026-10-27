export type PlanTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise'

export type MetricFormat = 'number' | 'currency' | 'compact'

export interface Kpi {
  id: 'total-users' | 'mrr' | 'active-subscriptions' | 'usage'
  value: number
  format: MetricFormat
  /** Percentage change versus the previous period, e.g. 12.4 = +12.4% */
  change: number
  /** Values interpolated into the localized caption (`kpi.<id>.caption`). */
  captionParams: Record<string, { value: number; format: MetricFormat }>
  href: string
}

export type RevenueRange = '7d' | '30d' | '90d' | '12m'

export interface RevenuePoint {
  /** ISO date (day for short ranges, first-of-month for 12m) */
  date: string
  mrr: number
  newRevenue: number
}

export interface RevenueSeries {
  range: RevenueRange
  points: RevenuePoint[]
  total: number
  change: number
}

export type OrderStatus = 'paid' | 'pending' | 'failed' | 'refunded'

export interface Order {
  id: string
  invoiceNumber: string
  customer: {
    name: string
    email: string
  }
  organization: string
  plan: PlanTier
  interval: 'monthly' | 'yearly'
  /** Amount in cents */
  amount: number
  currency: 'USD'
  status: OrderStatus
  paymentMethod: string
  createdAt: string
}

export type SignupSource = 'Organic' | 'Referral' | 'Google' | 'GitHub' | 'Product Hunt'

export interface UserRegistration {
  id: string
  name: string
  email: string
  organization: string
  plan: PlanTier
  source: SignupSource
  country: string
  createdAt: string
}

export type UserRole = 'Owner' | 'Admin' | 'Member'

export interface InviteUserInput {
  name: string
  email: string
  organization: string
  role: UserRole
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

export type QueueName = 'emails' | 'ai-inference' | 'billing-sync' | 'exports'

export interface JobQueue {
  name: QueueName
  counts: Record<JobStatus, number>
}

export interface FailedJob {
  id: string
  name: string
  queue: string
  error: string
  attempts: number
  maxAttempts: number
  failedAt: string
}

export interface JobSummary {
  queues: JobQueue[]
  failedJobs: FailedJob[]
  throughputPerMinute: number
}

export type ServiceHealth = 'operational' | 'degraded' | 'outage'

export type ServiceId = 'web' | 'api' | 'ai' | 'db' | 'queue' | 'payments'

export interface ServiceStatus {
  id: ServiceId
  /** Tech stack label, e.g. "Go · Gin". Not translated. */
  description: string
  health: ServiceHealth
  latencyMs: number
  /** Uptime over the last 30 days, 0-100 */
  uptime: number
}

export interface SystemStatus {
  services: ServiceStatus[]
  checkedAt: string
}

export type NotificationKind = 'aiLatency' | 'jobsFailed' | 'newSubscription' | 'usageReport'

export interface AppNotification {
  id: string
  /** Selects the localized template under `notifications.items.<kind>`. */
  kind: NotificationKind
  params: Record<string, string | number>
  href: string
  createdAt: string
  read: boolean
}

export interface CurrentUser {
  name: string
  email: string
  role: UserRole
  workspace: string
}

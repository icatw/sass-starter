import { MOCK_NOW } from '@/lib/format'
import type {
  AppNotification,
  CurrentUser,
  JobSummary,
  Kpi,
  Order,
  OrderStatus,
  PlanTier,
  RevenuePoint,
  RevenueRange,
  RevenueSeries,
  SignupSource,
  SystemStatus,
  UserRegistration,
} from '@/lib/types'

function createRandom(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000

function isoAgo(ms: number) {
  return new Date(MOCK_NOW.getTime() - ms).toISOString()
}

export const currentUser: CurrentUser = {
  name: 'Alex Morgan',
  email: 'alex@saasfoundry.dev',
  role: 'Owner',
  workspace: 'SaaS Foundry',
}

export const kpis: Kpi[] = [
  {
    id: 'total-users',
    label: 'Total Users',
    value: 12_847,
    format: 'number',
    change: 8.2,
    caption: '+974 this month',
    href: '/users',
  },
  {
    id: 'mrr',
    label: 'Monthly Recurring Revenue',
    value: 48_290,
    format: 'currency',
    change: 12.4,
    caption: 'ARR $579,480',
    href: '/billing/subscriptions',
  },
  {
    id: 'active-subscriptions',
    label: 'Active Subscriptions',
    value: 1_284,
    format: 'number',
    change: 4.1,
    caption: '38 trialing · 2.1% churn',
    href: '/billing/subscriptions',
  },
  {
    id: 'usage',
    label: 'Usage This Month',
    value: 2_412_580,
    format: 'compact',
    change: -3.6,
    caption: 'credits · 80% of pooled quota',
    href: '/usage',
  },
]

const dailyRevenue: RevenuePoint[] = (() => {
  const random = createRandom(42)
  const days = 450
  const startMrr = 29_400
  const endMrr = 48_290
  return Array.from({ length: days }, (_, index) => {
    const progress = index / (days - 1)
    const trend = startMrr + (endMrr - startMrr) * Math.pow(progress, 1.15)
    const noise = (random() - 0.5) * 900
    const weekday = new Date(MOCK_NOW.getTime() - (days - 1 - index) * DAY).getUTCDay()
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.55 : 1
    return {
      date: new Date(MOCK_NOW.getTime() - (days - 1 - index) * DAY).toISOString().slice(0, 10),
      mrr: index === days - 1 ? endMrr : Math.round(trend + noise),
      newRevenue: Math.round((520 + random() * 1100) * weekendFactor * (0.75 + progress * 0.5)),
    }
  })
})()

const RANGE_DAYS: Record<Exclude<RevenueRange, '12m'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

function sumRevenue(points: RevenuePoint[]) {
  return points.reduce((sum, point) => sum + point.newRevenue, 0)
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function buildRevenueSeries(range: RevenueRange): RevenueSeries {
  if (range === '12m') {
    const months = new Map<string, RevenuePoint>()
    for (const point of dailyRevenue) {
      const key = `${point.date.slice(0, 7)}-01`
      const existing = months.get(key)
      months.set(key, {
        date: key,
        mrr: point.mrr,
        newRevenue: (existing?.newRevenue ?? 0) + point.newRevenue,
      })
    }
    const points = Array.from(months.values()).slice(-12)
    const first = points[0]
    const last = points[points.length - 1]
    return {
      range,
      points,
      total: sumRevenue(points),
      change: percentChange(last.mrr, first.mrr),
    }
  }

  const days = RANGE_DAYS[range]
  const points = dailyRevenue.slice(-days)
  const previous = dailyRevenue.slice(-days * 2, -days)
  return {
    range,
    points,
    total: sumRevenue(points),
    change: percentChange(sumRevenue(points), sumRevenue(previous)),
  }
}

const PEOPLE = [
  ['Olivia Chen', 'Lumen Analytics'],
  ['Marcus Reid', 'Northwind Labs'],
  ['Sofia Alvarez', 'Pixel & Pine'],
  ['Daniel Kim', 'Quanta AI'],
  ['Hannah Weber', 'Brightpath'],
  ['Ethan Brooks', 'Copperline'],
  ['Aisha Patel', 'Stackforge'],
  ['Lucas Martin', 'Driftwood Studio'],
  ['Mei Tanaka', 'Kumo Systems'],
  ['Noah Fischer', 'Helix Health'],
  ['Grace Liu', 'Atlas Freight'],
  ['Omar Haddad', 'Sandline'],
  ['Chloe Dubois', 'Maison Data'],
  ['Ravi Sharma', 'Orbitly'],
  ['Emma Johansson', 'Fjord Cloud'],
  ['Jacob Turner', 'Ledgerly'],
] as const

function emailFor(name: string, org: string) {
  const [first, last] = name.toLowerCase().split(' ')
  const domain = org.toLowerCase().replace(/[^a-z]/g, '')
  return `${first}.${last}@${domain}.io`
}

const PLAN_PRICES: Record<Exclude<PlanTier, 'Free'>, { monthly: number; yearly: number }> = {
  Starter: { monthly: 1_900, yearly: 19_000 },
  Pro: { monthly: 4_900, yearly: 49_000 },
  Enterprise: { monthly: 24_900, yearly: 249_000 },
}

const PAYMENT_METHODS = ['Visa •••• 4242', 'Mastercard •••• 5100', 'Amex •••• 0005', 'SEPA •••• 3000', 'Visa •••• 1881']

export const orders: Order[] = (() => {
  const random = createRandom(7)
  const paidPlans: Exclude<PlanTier, 'Free'>[] = ['Starter', 'Pro', 'Pro', 'Starter', 'Enterprise', 'Pro']
  const statuses: OrderStatus[] = ['paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'failed', 'paid', 'refunded']
  return Array.from({ length: 32 }, (_, index) => {
    const [name, organization] = PEOPLE[index % PEOPLE.length]
    const plan = paidPlans[Math.floor(random() * paidPlans.length)]
    const interval = random() > 0.72 ? 'yearly' : 'monthly'
    const status = index === 0 ? 'pending' : statuses[Math.floor(random() * statuses.length)]
    const minutesAgo = Math.round(index * 190 + random() * 160 + 4)
    return {
      id: `ord_${(9_481_270 - index * 137).toString(36)}`,
      invoiceNumber: `INV-2026-${(4_812 - index).toString().padStart(5, '0')}`,
      customer: { name, email: emailFor(name, organization) },
      organization,
      plan,
      interval,
      amount: PLAN_PRICES[plan][interval],
      currency: 'USD',
      status,
      paymentMethod: PAYMENT_METHODS[Math.floor(random() * PAYMENT_METHODS.length)],
      createdAt: isoAgo(minutesAgo * MINUTE),
    } satisfies Order
  })
})()

const SOURCES: SignupSource[] = ['Organic', 'GitHub', 'Google', 'Referral', 'Product Hunt']
const COUNTRIES = ['United States', 'Germany', 'Japan', 'United Kingdom', 'India', 'Canada', 'France', 'Brazil']
const SIGNUP_PEOPLE = [
  ['Priya Nair', 'Fernway'],
  ['Leo Novak', 'Brickhouse'],
  ['Amara Okafor', 'Kinetic Ops'],
  ['Felix Wagner', 'Parcel Point'],
  ['Yuki Sato', 'Mochi Labs'],
  ['Isabella Rossi', 'Verde Studio'],
  ['Samuel Green', 'Tidal Metrics'],
  ['Nora Lindqvist', 'Polar Forms'],
] as const

export const recentRegistrations: UserRegistration[] = SIGNUP_PEOPLE.map(([name, organization], index) => ({
  id: `usr_${(31_870 - index * 17).toString(36)}`,
  name,
  email: emailFor(name, organization),
  organization,
  plan: (['Free', 'Starter', 'Free', 'Pro', 'Free', 'Starter', 'Free', 'Pro'] as PlanTier[])[index],
  source: SOURCES[index % SOURCES.length],
  country: COUNTRIES[index % COUNTRIES.length],
  createdAt: isoAgo((index * 47 + 6) * MINUTE + index * index * 9 * MINUTE),
}))

export const jobSummary: JobSummary = {
  throughputPerMinute: 342,
  queues: [
    {
      name: 'emails',
      description: 'Transactional email delivery',
      counts: { queued: 18, running: 4, completed: 12_480, failed: 3 },
    },
    {
      name: 'ai-inference',
      description: 'Async model calls via Python service',
      counts: { queued: 64, running: 12, completed: 8_215, failed: 9 },
    },
    {
      name: 'billing-sync',
      description: 'Stripe webhook reconciliation',
      counts: { queued: 2, running: 1, completed: 1_904, failed: 0 },
    },
    {
      name: 'exports',
      description: 'CSV and report generation',
      counts: { queued: 5, running: 2, completed: 386, failed: 1 },
    },
  ],
  failedJobs: [
    {
      id: 'job_8f2k1x',
      name: 'GenerateEmbeddings',
      queue: 'ai-inference',
      error: 'Upstream timeout after 30000ms (provider: openai)',
      attempts: 3,
      maxAttempts: 5,
      failedAt: isoAgo(12 * MINUTE),
    },
    {
      name: 'SendInvoiceEmail',
      id: 'job_7a9d3m',
      queue: 'emails',
      error: 'SMTP 421: Service temporarily unavailable',
      attempts: 2,
      maxAttempts: 5,
      failedAt: isoAgo(38 * MINUTE),
    },
    {
      id: 'job_6c1p8q',
      name: 'BuildUsageReport',
      queue: 'exports',
      error: 'Memory limit exceeded (512MB)',
      attempts: 5,
      maxAttempts: 5,
      failedAt: isoAgo(2 * HOUR + 14 * MINUTE),
    },
  ],
}

export const systemStatus: SystemStatus = {
  checkedAt: isoAgo(1 * MINUTE),
  services: [
    { id: 'web', name: 'Web App', description: 'Next.js frontend', health: 'operational', latencyMs: 84, uptime: 99.99 },
    { id: 'api', name: 'Business API', description: 'Go · Gin', health: 'operational', latencyMs: 41, uptime: 99.98 },
    { id: 'ai', name: 'AI Service', description: 'Python · FastAPI', health: 'degraded', latencyMs: 1_240, uptime: 99.62 },
    { id: 'db', name: 'Database', description: 'PostgreSQL primary', health: 'operational', latencyMs: 6, uptime: 100 },
    { id: 'queue', name: 'Job Queue', description: 'Redis workers', health: 'operational', latencyMs: 3, uptime: 99.97 },
    { id: 'payments', name: 'Payments', description: 'Stripe webhooks', health: 'operational', latencyMs: 212, uptime: 99.95 },
  ],
}

export const notifications: AppNotification[] = [
  {
    id: 'ntf_1',
    title: 'AI Service latency elevated',
    description: 'p95 latency is above 1s for the last 15 minutes.',
    href: '/ai-providers',
    createdAt: isoAgo(9 * MINUTE),
    read: false,
  },
  {
    id: 'ntf_2',
    title: '3 jobs failed in ai-inference',
    description: 'GenerateEmbeddings exceeded the provider timeout.',
    href: '/jobs',
    createdAt: isoAgo(14 * MINUTE),
    read: false,
  },
  {
    id: 'ntf_3',
    title: 'New Enterprise subscription',
    description: 'Quanta AI upgraded to Enterprise (yearly).',
    href: '/billing/subscriptions',
    createdAt: isoAgo(2 * HOUR),
    read: false,
  },
  {
    id: 'ntf_4',
    title: 'Weekly usage report ready',
    description: 'Credits consumed rose 6% week over week.',
    href: '/usage',
    createdAt: isoAgo(1 * DAY),
    read: true,
  },
]

import {
  Activity,
  Building2,
  Coins,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Messages } from '@/lib/i18n/dictionaries/en'

/** Keys into `nav.items` in the dictionaries; titles, descriptions and plans are localized there. */
export type NavKey = keyof Messages['nav']['items']
export type NavGroupKey = keyof Messages['nav']['groups']
export type NavAvailability = 'available' | 'demo' | 'planned'

export interface NavLeaf {
  key: NavKey
  href: string
  availability: NavAvailability
}

export interface NavItem extends NavLeaf {
  icon: LucideIcon
  children?: NavLeaf[]
}

export interface NavGroup {
  key: NavGroupKey
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    key: 'platform',
    items: [
      { key: 'overview', href: '/dashboard', icon: LayoutDashboard, availability: 'demo' },
      { key: 'users', href: '/admin/users', icon: Users, availability: 'available' },
      { key: 'organizations', href: '/admin/organizations', icon: Building2, availability: 'planned' },
    ],
  },
  {
    key: 'revenue',
    items: [
      {
        key: 'billing',
        href: '/billing',
        icon: CreditCard,
        availability: 'planned',
        children: [
          { key: 'plans', href: '/billing/plans', availability: 'planned' },
          { key: 'subscriptions', href: '/billing/subscriptions', availability: 'planned' },
          { key: 'orders', href: '/billing/orders', availability: 'planned' },
          { key: 'payments', href: '/billing/payments', availability: 'planned' },
        ],
      },
      { key: 'usage', href: '/usage', icon: Coins, availability: 'planned' },
    ],
  },
  {
    key: 'infrastructure',
    items: [
      { key: 'aiProviders', href: '/ai-providers', icon: Sparkles, availability: 'planned' },
      { key: 'jobs', href: '/jobs', icon: Activity, availability: 'planned' },
      { key: 'files', href: '/files', icon: FolderOpen, availability: 'planned' },
    ],
  },
  {
    key: 'system',
    items: [
      { key: 'auditLogs', href: '/audit-logs', icon: ScrollText, availability: 'available' },
      { key: 'settings', href: '/settings', icon: Settings, availability: 'planned' },
    ],
  },
]

export interface Breadcrumb {
  key: NavKey
  href: string
}

export interface ResolvedPage extends NavLeaf {
  breadcrumbs: Breadcrumb[]
  icon: LucideIcon
}

export const navPages: ResolvedPage[] = navGroups.flatMap((group) =>
  group.items.flatMap((item) => {
    if (item.children) {
      return item.children.map((child) => ({
        ...child,
        icon: item.icon,
        breadcrumbs: [
          { key: item.key, href: item.children![0].href },
          { key: child.key, href: child.href },
        ],
      }))
    }
    return [{ key: item.key, href: item.href, icon: item.icon, availability: item.availability, breadcrumbs: [{ key: item.key, href: item.href }] }]
  }),
)

export function findPage(pathname: string): ResolvedPage | undefined {
  return navPages.find((page) => page.href === pathname)
}

export function findNavLeaf(key: NavKey): NavLeaf | undefined {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.key === key) return item
      const child = item.children?.find((entry) => entry.key === key)
      if (child) return child
    }
  }
  return undefined
}

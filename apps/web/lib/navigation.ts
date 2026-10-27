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

export interface NavLeaf {
  key: NavKey
  href: string
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
      { key: 'overview', href: '/dashboard', icon: LayoutDashboard },
      { key: 'users', href: '/admin/users', icon: Users },
      { key: 'organizations', href: '/admin/organizations', icon: Building2 },
    ],
  },
  {
    key: 'revenue',
    items: [
      {
        key: 'billing',
        href: '/billing',
        icon: CreditCard,
        children: [
          { key: 'plans', href: '/billing/plans' },
          { key: 'subscriptions', href: '/billing/subscriptions' },
          { key: 'orders', href: '/billing/orders' },
          { key: 'payments', href: '/billing/payments' },
        ],
      },
      { key: 'usage', href: '/usage', icon: Coins },
    ],
  },
  {
    key: 'infrastructure',
    items: [
      { key: 'aiProviders', href: '/ai-providers', icon: Sparkles },
      { key: 'jobs', href: '/jobs', icon: Activity },
      { key: 'files', href: '/files', icon: FolderOpen },
    ],
  },
  {
    key: 'system',
    items: [
      { key: 'auditLogs', href: '/audit-logs', icon: ScrollText },
      { key: 'settings', href: '/settings', icon: Settings },
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
    return [{ key: item.key, href: item.href, icon: item.icon, breadcrumbs: [{ key: item.key, href: item.href }] }]
  }),
)

export function findPage(pathname: string): ResolvedPage | undefined {
  return navPages.find((page) => page.href === pathname)
}

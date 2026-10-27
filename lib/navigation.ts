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

export interface NavLeaf {
  title: string
  href: string
  description: string
  /** Capabilities planned for this module; shown while the page is still scaffolded. */
  planned: string[]
}

export interface NavItem extends NavLeaf {
  icon: LucideIcon
  children?: NavLeaf[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      {
        title: 'Overview',
        href: '/',
        icon: LayoutDashboard,
        description: 'Revenue, growth, and platform health at a glance.',
        planned: [],
      },
      {
        title: 'Users',
        href: '/users',
        icon: Users,
        description: 'Manage accounts, roles, and access across your product.',
        planned: ['User directory with search and filters', 'Role management', 'Impersonation and session revocation'],
      },
      {
        title: 'Organizations',
        href: '/organizations',
        icon: Building2,
        description: 'Multi-tenant workspaces, members, and seat allocation.',
        planned: ['Organization directory', 'Member invitations', 'Seat and plan assignment'],
      },
    ],
  },
  {
    label: 'Revenue',
    items: [
      {
        title: 'Billing',
        href: '/billing',
        icon: CreditCard,
        description: 'Plans, subscriptions, orders, and payments.',
        planned: [],
        children: [
          {
            title: 'Plans',
            href: '/billing/plans',
            description: 'Define pricing tiers, features, and limits.',
            planned: ['Plan builder with feature flags', 'Monthly and yearly pricing', 'Credit allowances per tier'],
          },
          {
            title: 'Subscriptions',
            href: '/billing/subscriptions',
            description: 'Active, trialing, and canceled subscriptions.',
            planned: ['Subscription lifecycle', 'Upgrades, downgrades, and proration', 'Cancellation reasons'],
          },
          {
            title: 'Orders',
            href: '/billing/orders',
            description: 'One-time purchases, renewals, and invoices.',
            planned: ['Full order history', 'Invoice downloads', 'Refund workflow'],
          },
          {
            title: 'Payments',
            href: '/billing/payments',
            description: 'Payment attempts, disputes, and payouts.',
            planned: ['Payment attempts and retries', 'Dispute tracking', 'Provider webhooks log'],
          },
        ],
      },
      {
        title: 'Usage & Credits',
        href: '/usage',
        icon: Coins,
        description: 'Metered usage, credit balances, and quotas.',
        planned: ['Credit ledger', 'Per-organization quotas', 'Usage-based billing exports'],
      },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      {
        title: 'AI Providers',
        href: '/ai-providers',
        icon: Sparkles,
        description: 'Model providers, routing, and token spend.',
        planned: ['Provider credentials and routing', 'Model allowlists per plan', 'Token cost tracking'],
      },
      {
        title: 'Background Jobs',
        href: '/jobs',
        icon: Activity,
        description: 'Queues, workers, schedules, and retries.',
        planned: ['Queue explorer', 'Job retries and dead-letter handling', 'Cron schedules'],
      },
      {
        title: 'Files',
        href: '/files',
        icon: FolderOpen,
        description: 'Uploaded assets and storage usage.',
        planned: ['File browser', 'Storage quotas', 'Signed URL generation'],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        title: 'Audit Logs',
        href: '/audit-logs',
        icon: ScrollText,
        description: 'Every administrative action, searchable and exportable.',
        planned: ['Event stream with filters', 'Actor and resource drill-down', 'CSV export'],
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Workspace, branding, API keys, and integrations.',
        planned: ['Workspace profile', 'API keys', 'Webhook endpoints'],
      },
    ],
  },
]

export interface Breadcrumb {
  title: string
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
          { title: item.title, href: item.children![0].href },
          { title: child.title, href: child.href },
        ],
      }))
    }
    return [{ ...item, breadcrumbs: [{ title: item.title, href: item.href }] }]
  }),
)

export function findPage(pathname: string): ResolvedPage | undefined {
  return navPages.find((page) => page.href === pathname)
}

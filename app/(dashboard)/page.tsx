import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCards } from '@/components/overview/kpi-cards'
import { RevenueChart } from '@/components/overview/revenue-chart'
import { RecentOrders } from '@/components/overview/recent-orders'
import { RecentRegistrations } from '@/components/overview/recent-registrations'
import { JobStatusSummary } from '@/components/overview/job-status-summary'
import { SystemStatus } from '@/components/overview/system-status'
import { OverviewActions } from '@/components/overview/overview-actions'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getI18n()
  return { title: messages.nav.items.overview.title }
}

export default async function OverviewPage() {
  const { messages } = await getI18n()
  const copy = messages.nav.items.overview

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={<OverviewActions />}
      />
      <KpiCards />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <RevenueChart />
          <RecentOrders />
        </div>
        <div className="flex flex-col gap-4">
          <RecentRegistrations />
          <JobStatusSummary />
          <SystemStatus />
        </div>
      </div>
    </div>
  )
}

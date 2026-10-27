import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCards } from '@/components/overview/kpi-cards'
import { RevenueChart } from '@/components/overview/revenue-chart'
import { RecentOrders } from '@/components/overview/recent-orders'
import { RecentRegistrations } from '@/components/overview/recent-registrations'
import { JobStatusSummary } from '@/components/overview/job-status-summary'
import { SystemStatus } from '@/components/overview/system-status'
import { OverviewActions } from '@/components/overview/overview-actions'

export const metadata: Metadata = { title: 'Overview' }

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Overview"
        description="Revenue, growth, and platform health for your workspace."
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

'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { getOrders } from '@/lib/api/overview'
import { cn } from '@/lib/utils'

const OVERVIEW_KEY_PREFIXES = ['overview/', 'billing/', 'users/', 'jobs/', 'system/']

function matchesOverviewKey(key: unknown) {
  const value = Array.isArray(key) ? key[0] : key
  return typeof value === 'string' && OVERVIEW_KEY_PREFIXES.some((prefix) => value.startsWith(prefix))
}

export function OverviewActions() {
  const { t } = useI18n()
  const { mutate } = useSWRConfig()
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await mutate(matchesOverviewKey)
    setRefreshing(false)
    toast.success(t('overview.refreshed'))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const orders = await getOrders()
      const header = ['invoice', 'customer', 'email', 'organization', 'plan', 'interval', 'amount_usd', 'status', 'created_at']
      const rows = orders.map((order) => [
        order.invoiceNumber,
        order.customer.name,
        order.customer.email,
        order.organization,
        order.plan,
        order.interval,
        (order.amount / 100).toFixed(2),
        order.status,
        order.createdAt,
      ])
      const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'orders.csv'
      link.click()
      URL.revokeObjectURL(url)
      toast.success(t('overview.exported', { count: orders.length }))
    } catch {
      toast.error(t('overview.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
        <RefreshCw data-icon="inline-start" className={cn(refreshing && 'animate-spin')} />
        {t('overview.refresh')}
      </Button>
      <Button size="sm" onClick={handleExport} disabled={exporting}>
        <Download data-icon="inline-start" />
        {t('overview.exportOrders')}
      </Button>
    </>
  )
}

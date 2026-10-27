'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { useSystemStatus } from '@/hooks/use-overview-data'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ServiceHealth } from '@/lib/types'

const HEALTH: Record<ServiceHealth, { label: string; tone: StatusTone }> = {
  operational: { label: 'Operational', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  outage: { label: 'Outage', tone: 'danger' },
}

export function SystemStatus() {
  const { data, error, isLoading, isValidating, mutate } = useSystemStatus()
  const issues = data?.services.filter((service) => service.health !== 'operational').length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>System status</CardTitle>
        <CardDescription>
          {data
            ? issues === 0
              ? 'All systems operational'
              : `${issues} service${issues > 1 ? 's' : ''} reporting issues`
            : 'Checking services...'}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh status"
            disabled={isValidating}
            onClick={() => mutate()}
          >
            <RefreshCw className={cn(isValidating && 'animate-spin')} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-9 w-full" />)
        ) : (
          <>
            <ul className="-mx-2 flex flex-col">
              {data.services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{service.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">{service.latencyMs}ms</span> ·{' '}
                      <span className="font-mono tabular-nums">{service.uptime.toFixed(2)}%</span> uptime
                    </span>
                  </div>
                  <StatusBadge tone={HEALTH[service.health].tone}>{HEALTH[service.health].label}</StatusBadge>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Last checked {formatDateTime(data.checkedAt)}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { useI18n } from '@/components/providers/i18n-provider'
import { useSystemStatus } from '@/hooks/use-overview-data'
import { cn } from '@/lib/utils'
import type { ServiceHealth } from '@/lib/types'

const HEALTH_TONE: Record<ServiceHealth, StatusTone> = {
  operational: 'success',
  degraded: 'warning',
  outage: 'danger',
}

export function SystemStatus() {
  const { t, format } = useI18n()
  const { data, error, isLoading, isValidating, mutate } = useSystemStatus()
  const issues = data?.services.filter((service) => service.health !== 'operational').length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('system.title')}</CardTitle>
        <CardDescription>
          {data
            ? issues === 0
              ? t('system.allOperational')
              : issues === 1
                ? t('system.issues_one')
                : t('system.issues', { count: issues })
            : t('system.checking')}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('system.refresh')}
            disabled={isValidating}
            onClick={() => mutate()}
          >
            <RefreshCw className={cn(isValidating && 'animate-spin')} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-9 w-full" />)
        ) : (
          <>
            <ul className="-mx-2 flex flex-col">
              {data.services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{t(`system.services.${service.id}`)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="font-mono tabular-nums">{service.latencyMs}ms</span> ·{' '}
                      <span className="font-mono tabular-nums">{service.uptime.toFixed(2)}%</span> {t('system.uptime')}
                    </span>
                  </div>
                  <StatusBadge tone={HEALTH_TONE[service.health]}>{t(`system.health.${service.health}`)}</StatusBadge>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{t('system.lastChecked', { date: format.dateTime(data.checkedAt) })}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

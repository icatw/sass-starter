'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { useI18n } from '@/components/providers/i18n-provider'
import { useKpis } from '@/hooks/use-overview-data'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/lib/types'

export function KpiCards() {
  const { data, error, isLoading, mutate } = useKpis()

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading || !data
        ? Array.from({ length: 4 }, (_, index) => <KpiCardSkeleton key={index} />)
        : data.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const { t, format } = useI18n()
  const positive = kpi.change >= 0
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight
  const captionParams = Object.fromEntries(
    Object.entries(kpi.captionParams).map(([key, param]) => [key, format.metric(param.value, param.format)]),
  )

  return (
    <Link
      href={kpi.href}
      className="rounded-xl outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardDescription>{t(`kpi.${kpi.id}.label`)}</CardDescription>
          <CardTitle className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {format.metric(kpi.value, kpi.format)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium tabular-nums',
              positive ? 'text-success' : 'text-destructive',
            )}
          >
            <TrendIcon aria-hidden className="size-3.5" />
            {format.change(kpi.change)}
          </span>
          <span className="truncate text-muted-foreground">{t(`kpi.${kpi.id}.caption`, captionParams)}</span>
        </CardContent>
      </Card>
    </Link>
  )
}

function KpiCardSkeleton() {
  return (
    <Card size="sm">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  )
}

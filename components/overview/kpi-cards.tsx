'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { useKpis } from '@/hooks/use-overview-data'
import { formatChange, formatMetric } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/lib/types'

export function KpiCards() {
  const { data, error, isLoading, mutate } = useKpis()

  if (error) return <ErrorState message={error.message} onRetry={() => mutate()} />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading || !data
        ? Array.from({ length: 4 }, (_, index) => <KpiCardSkeleton key={index} />)
        : data.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const positive = kpi.change >= 0
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <Link
      href={kpi.href}
      className="rounded-xl outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardDescription>{kpi.label}</CardDescription>
          <CardTitle className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {formatMetric(kpi.value, kpi.format)}
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
            {formatChange(kpi.change)}
          </span>
          <span className="truncate text-muted-foreground">{kpi.caption}</span>
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

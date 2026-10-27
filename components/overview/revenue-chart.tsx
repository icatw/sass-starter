'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ErrorState } from '@/components/shared/error-state'
import { useRevenue } from '@/hooks/use-overview-data'
import { formatChange, formatCompact, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RevenueRange } from '@/lib/types'

const RANGES: { value: RevenueRange; label: string; description: string }[] = [
  { value: '7d', label: '7D', description: 'last 7 days' },
  { value: '30d', label: '30D', description: 'last 30 days' },
  { value: '90d', label: '90D', description: 'last 90 days' },
  { value: '12m', label: '12M', description: 'last 12 months' },
]

const chartConfig = {
  mrr: { label: 'MRR', color: 'var(--chart-5)' },
  newRevenue: { label: 'New revenue', color: 'var(--chart-2)' },
} satisfies ChartConfig

const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })

export function RevenueChart() {
  const [range, setRange] = useState<RevenueRange>('30d')
  const { data, error, isLoading, isValidating, mutate } = useRevenue(range)
  const formatTick = (iso: string) => (range === '12m' ? monthFormatter : dayFormatter).format(new Date(iso))
  const activeRange = RANGES.find((item) => item.value === range)!

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>
          {data ? (
            <>
              <span className="font-mono font-medium text-foreground tabular-nums">{formatCurrency(data.total)}</span>{' '}
              collected in the {activeRange.description}{' '}
              <span className={cn('tabular-nums', data.change >= 0 ? 'text-success' : 'text-destructive')}>
                {formatChange(data.change)}
              </span>
            </>
          ) : (
            <Skeleton className="h-4 w-56" />
          )}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[range]}
            onValueChange={(value) => {
              const next = value[0] as RevenueRange | undefined
              if (next) setRange(next)
            }}
            aria-label="Revenue time range"
          >
            {RANGES.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value} aria-label={item.description} className="px-2.5">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className={cn('aspect-auto h-72 w-full transition-opacity', isValidating && 'opacity-60')}
          >
            <AreaChart data={data.points} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fill-mrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mrr)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="var(--color-mrr)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(value: number) => `$${formatCompact(value)}`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => {
                      const iso = payload?.[0]?.payload?.date as string | undefined
                      return iso ? formatTick(iso) : null
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="mrr"
                type="monotone"
                stroke="var(--color-mrr)"
                strokeWidth={1.75}
                fill="url(#fill-mrr)"
              />
              <Area
                dataKey="newRevenue"
                type="monotone"
                stroke="var(--color-newRevenue)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="transparent"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

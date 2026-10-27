'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronRight, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ErrorState } from '@/components/shared/error-state'
import { useI18n } from '@/components/providers/i18n-provider'
import { translateError } from '@/components/shared/error-state'
import { useJobSummary } from '@/hooks/use-overview-data'
import { retryFailedJobs } from '@/lib/api/overview'
import { cn } from '@/lib/utils'
import type { JobQueue, JobStatus } from '@/lib/types'

const STATUS_BAR: Record<JobStatus, string> = {
  completed: 'bg-foreground/80',
  running: 'bg-primary/50',
  queued: 'bg-muted-foreground/30',
  failed: 'bg-destructive',
}
const STATUS_ORDER: JobStatus[] = ['completed', 'running', 'queued', 'failed']

export function JobStatusSummary() {
  const { t, format } = useI18n()
  const { data, error, isLoading, mutate } = useJobSummary()
  const [retrying, setRetrying] = useState(false)

  const totals = STATUS_ORDER.map((status) => ({
    status,
    value: data?.queues.reduce((sum, queue) => sum + queue.counts[status], 0) ?? 0,
  }))

  async function handleRetry() {
    setRetrying(true)
    try {
      const before = data?.failedJobs.length ?? 0
      const next = await retryFailedJobs()
      await mutate(next, { revalidate: false })
      const count = before - next.failedJobs.length
      toast.success(count === 1 ? t('jobs.retried_one') : t('jobs.retried', { count }))
    } catch (err) {
      toast.error(t('jobs.retryFailed'), { description: translateError(t, err) })
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('jobs.title')}</CardTitle>
        <CardDescription>
          {data
            ? t('jobs.throughput', { rate: format.number(data.throughputPerMinute), count: data.queues.length })
            : t('jobs.fallbackDescription')}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/jobs" />} nativeButton={false}>
            {t('common.open')}
            <ChevronRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-4 gap-2">
              {totals.map(({ status, value }) => (
                <div key={status} className="flex flex-col gap-0.5">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_BAR[status])} />
                    {t(`jobs.status.${status}`)}
                  </dt>
                  <dd className={cn('font-mono text-lg font-semibold tabular-nums', status === 'failed' && value > 0 && 'text-destructive')}>
                    {format.number(value)}
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="flex flex-col gap-3">
              {data.queues.map((queue) => (
                <QueueRow key={queue.name} queue={queue} />
              ))}
            </ul>
            <Separator />
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-muted-foreground">{t('jobs.recentFailures')}</h3>
              {data.failedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('jobs.noFailures')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.failedJobs.slice(0, 3).map((job) => (
                    <li key={job.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-mono text-xs">{job.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{job.error}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {job.attempts}/{job.maxAttempts} · {format.relative(job.failedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
      {data && !error && data.failedJobs.length > 0 && (
        <CardFooter className="border-t">
          <Button variant="outline" size="sm" className="w-full" disabled={retrying} onClick={handleRetry}>
            {retrying ? <Spinner data-icon="inline-start" /> : <RotateCw data-icon="inline-start" />}
            {t('jobs.retry')}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function QueueRow({ queue }: { queue: JobQueue }) {
  const { t, format } = useI18n()
  const total = STATUS_ORDER.reduce((sum, status) => sum + queue.counts[status], 0)

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-mono text-xs font-medium">{queue.name}</span>
        <span className="truncate text-xs text-muted-foreground">{t(`jobs.queues.${queue.name}`)}</span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={<div role="img" tabIndex={0} aria-label={t('jobs.queueBreakdown', { queue: queue.name })} />}
          className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {STATUS_ORDER.map((status) =>
            queue.counts[status] > 0 ? (
              <span
                key={status}
                className={STATUS_BAR[status]}
                style={{ width: `${(queue.counts[status] / Math.max(total, 1)) * 100}%` }}
              />
            ) : null,
          )}
        </TooltipTrigger>
        <TooltipContent>
          {STATUS_ORDER.map((status) => `${t(`jobs.status.${status}`)} ${format.number(queue.counts[status])}`).join(' · ')}
        </TooltipContent>
      </Tooltip>
    </li>
  )
}

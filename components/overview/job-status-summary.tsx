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
import { useJobSummary } from '@/hooks/use-overview-data'
import { retryFailedJobs } from '@/lib/api/overview'
import { formatNumber, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { JobQueue, JobStatus } from '@/lib/types'

const STATUS_META: Record<JobStatus, { label: string; barClass: string }> = {
  completed: { label: 'Completed', barClass: 'bg-foreground/80' },
  running: { label: 'Running', barClass: 'bg-primary/50' },
  queued: { label: 'Queued', barClass: 'bg-muted-foreground/30' },
  failed: { label: 'Failed', barClass: 'bg-destructive' },
}
const STATUS_ORDER: JobStatus[] = ['completed', 'running', 'queued', 'failed']

export function JobStatusSummary() {
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
      toast.success(`Re-queued ${before - next.failedJobs.length} failed jobs`)
    } catch (err) {
      toast.error('Retry failed', { description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background jobs</CardTitle>
        <CardDescription>
          {data ? `${formatNumber(data.throughputPerMinute)} jobs/min across ${data.queues.length} queues` : 'Queue health in the last 24 hours'}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/jobs" />} nativeButton={false}>
            Open
            <ChevronRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
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
                    <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_META[status].barClass)} />
                    {STATUS_META[status].label}
                  </dt>
                  <dd className={cn('font-mono text-lg font-semibold tabular-nums', status === 'failed' && value > 0 && 'text-destructive')}>
                    {formatNumber(value)}
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
              <h3 className="text-xs font-medium text-muted-foreground">Recent failures</h3>
              {data.failedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No failed jobs. All queues are healthy.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.failedJobs.slice(0, 3).map((job) => (
                    <li key={job.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-mono text-xs">{job.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{job.error}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {job.attempts}/{job.maxAttempts} · {formatRelative(job.failedAt)}
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
            Retry failed jobs
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function QueueRow({ queue }: { queue: JobQueue }) {
  const total = STATUS_ORDER.reduce((sum, status) => sum + queue.counts[status], 0)

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-mono text-xs font-medium">{queue.name}</span>
        <span className="truncate text-xs text-muted-foreground">{queue.description}</span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={<div role="img" tabIndex={0} aria-label={`${queue.name} queue breakdown`} />}
          className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {STATUS_ORDER.map((status) =>
            queue.counts[status] > 0 ? (
              <span
                key={status}
                className={STATUS_META[status].barClass}
                style={{ width: `${(queue.counts[status] / Math.max(total, 1)) * 100}%` }}
              />
            ) : null,
          )}
        </TooltipTrigger>
        <TooltipContent>
          {STATUS_ORDER.map((status) => `${STATUS_META[status].label} ${formatNumber(queue.counts[status])}`).join(' · ')}
        </TooltipContent>
      </Tooltip>
    </li>
  )
}

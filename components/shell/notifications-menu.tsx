'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useNotifications } from '@/hooks/use-overview-data'
import { markNotificationsRead } from '@/lib/api/overview'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

export function NotificationsMenu() {
  const { data, isLoading, mutate } = useNotifications()
  const unread = data?.filter((item) => !item.read) ?? []

  async function markAllRead() {
    await mutate(markNotificationsRead(unread.map((item) => item.id)), {
      optimisticData: data?.map((item) => ({ ...item, read: true })),
      rollbackOnError: true,
      revalidate: false,
    })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'}
          />
        }
      >
        <Bell />
        {unread.length > 0 && (
          <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          <Button variant="ghost" size="xs" onClick={markAllRead} disabled={unread.length === 0}>
            Mark all read
          </Button>
        </div>
        <Separator />
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : data && data.length > 0 ? (
          <ul className="flex max-h-80 flex-col overflow-y-auto py-1">
            {data.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span
                    aria-hidden
                    className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.read ? 'bg-transparent' : 'bg-primary')}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className={cn('text-sm', !item.read && 'font-medium')}>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                    <span className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyTitle>All caught up</EmptyTitle>
              <EmptyDescription>New alerts about billing, jobs, and services will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </PopoverContent>
    </Popover>
  )
}

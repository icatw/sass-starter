'use client'

import { useMemo, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/shared/error-state'
import { InviteUserDialog } from '@/components/overview/invite-user-dialog'
import { useRegistrations } from '@/hooks/use-overview-data'
import { formatRelative, getInitials } from '@/lib/format'
import type { UserRegistration } from '@/lib/types'

type PlanFilter = 'all' | 'paid' | 'free'
const VISIBLE_COUNT = 6

export function RecentRegistrations() {
  const { data, error, isLoading, mutate } = useRegistrations()
  const [filter, setFilter] = useState<PlanFilter>('all')

  const visible = useMemo(() => {
    const rows = (data ?? []).filter((user) => {
      if (filter === 'paid') return user.plan !== 'Free'
      if (filter === 'free') return user.plan === 'Free'
      return true
    })
    return rows.slice(0, VISIBLE_COUNT)
  }, [data, filter])

  function handleInvited(user: UserRegistration) {
    mutate((users) => [user, ...(users ?? [])], { revalidate: false })
    setFilter('all')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New registrations</CardTitle>
        <CardDescription>Latest sign-ups across all organizations</CardDescription>
        <CardAction>
          <InviteUserDialog onInvited={handleInvited} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as PlanFilter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <ul className="flex flex-col gap-3" aria-busy>
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRound />
              </EmptyMedia>
              <EmptyTitle>No registrations</EmptyTitle>
              <EmptyDescription>Nobody matches this plan filter yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {visible.map((user) => (
              <li key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email} · {user.source}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={user.plan === 'Free' ? 'outline' : 'secondary'}>{user.plan}</Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatRelative(user.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

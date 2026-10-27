'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  MoreHorizontal,
  Receipt,
  Search,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorState } from '@/components/shared/error-state'
import { OrderDetailSheet } from '@/components/overview/order-detail-sheet'
import { OrderStatusBadge, ORDER_STATUSES } from '@/components/overview/order-status'
import { RefundOrderDialog } from '@/components/overview/refund-order-dialog'
import { useI18n } from '@/components/providers/i18n-provider'
import { useOrders } from '@/hooks/use-overview-data'
import type { Order, OrderStatus } from '@/lib/types'

const PAGE_SIZE = 6

type SortKey = 'createdAt' | 'amount'
type SortDirection = 'asc' | 'desc'
type StatusFilter = OrderStatus | 'all'

export function RecentOrders() {
  const { t, format } = useI18n()
  const statusItems = useMemo<{ value: StatusFilter; label: string }[]>(
    () => [
      { value: 'all', label: t('orders.allStatuses') },
      ...ORDER_STATUSES.map((value) => ({ value, label: t(`orderStatus.${value}`) })),
    ],
    [t],
  )
  const { data, error, isLoading, mutate } = useOrders()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'createdAt', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [refundTarget, setRefundTarget] = useState<Order | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const rows = (data ?? []).filter((order) => {
      if (status !== 'all' && order.status !== status) return false
      if (!normalized) return true
      return [order.invoiceNumber, order.customer.name, order.customer.email, order.organization]
        .some((field) => field.toLowerCase().includes(normalized))
    })
    const factor = sort.direction === 'asc' ? 1 : -1
    return rows.sort((a, b) =>
      sort.key === 'amount' ? (a.amount - b.amount) * factor : a.createdAt.localeCompare(b.createdAt) * factor,
    )
  }, [data, query, status, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    setSort((prev) => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }))
  }

  function handleRefunded(updated: Order) {
    mutate((orders) => orders?.map((order) => (order.id === updated.id ? updated : order)), { revalidate: false })
    setDetailOrder((current) => (current?.id === updated.id ? updated : current))
  }

  async function copyInvoice(order: Order) {
    try {
      await navigator.clipboard.writeText(order.invoiceNumber)
      toast.success(t('orders.copied'), { description: order.invoiceNumber })
    } catch {
      toast.error(t('orders.clipboardUnavailable'), { description: order.invoiceNumber })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('orders.title')}</CardTitle>
        <CardDescription>{t('orders.description')}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/billing/orders" />} nativeButton={false}>
            {t('common.viewAll')}
            <ChevronRight data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="sm:max-w-xs">
            <InputGroupInput
              placeholder={t('orders.searchPlaceholder')}
              aria-label={t('orders.searchAria')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <Select
            items={statusItems}
            value={status}
            onValueChange={(value) => {
              setStatus((value as StatusFilter | null) ?? 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-40" aria-label={t('orders.filterAria')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-3">{t('orders.columns.invoice')}</TableHead>
                  <TableHead>{t('orders.columns.customer')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('orders.columns.plan')}</TableHead>
                  <TableHead>{t('orders.columns.status')}</TableHead>
                  <TableHead className="text-right">
                    <SortButton label={t('orders.columns.amount')} active={sort.key === 'amount'} direction={sort.direction} onClick={() => toggleSort('amount')} align="end" />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <SortButton label={t('orders.columns.date')} active={sort.key === 'createdAt'} direction={sort.direction} onClick={() => toggleSort('createdAt')} />
                  </TableHead>
                  <TableHead className="w-10 pr-3">
                    <span className="sr-only">{t('orders.columns.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || !data ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="px-3">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : pageRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7}>
                      <Empty className="py-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Receipt />
                          </EmptyMedia>
                          <EmptyTitle>{t('orders.emptyTitle')}</EmptyTitle>
                          <EmptyDescription>{t('orders.emptyDescription')}</EmptyDescription>
                        </EmptyHeader>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuery('')
                            setStatus('all')
                          }}
                        >
                          {t('orders.clearFilters')}
                        </Button>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => setDetailOrder(order)}>
                      <TableCell className="pl-3 font-mono text-xs">{order.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{order.customer.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{order.organization}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {order.plan} · {t(`orders.intervalShort.${order.interval}`)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{format.cents(order.amount)}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{format.relative(order.createdAt)}</TableCell>
                      <TableCell className="pr-3" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label={t('orders.actionsFor', { invoice: order.invoiceNumber })} />}
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                                <Eye />
                                {t('orders.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyInvoice(order)}>
                                <Copy />
                                {t('orders.copyInvoice')}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={order.status !== 'paid'}
                                onClick={() => setRefundTarget(order)}
                              >
                                <Undo2 />
                                {t('orders.refund')}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {data && !error && (
        <CardFooter className="justify-between border-t text-xs text-muted-foreground">
          <span className="tabular-nums">
            {filtered.length === 0
              ? t('orders.empty')
              : t('orders.range', {
                  from: (currentPage - 1) * PAGE_SIZE + 1,
                  to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
          </span>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {t('orders.page', { page: currentPage, count: pageCount })}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('orders.previousPage')}
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('orders.nextPage')}
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </CardFooter>
      )}

      <OrderDetailSheet
        order={detailOrder}
        onOpenChange={(open) => !open && setDetailOrder(null)}
        onRefund={(order) => setRefundTarget(order)}
      />
      <RefundOrderDialog
        order={refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        onRefunded={handleRefunded}
      />
    </Card>
  )
}

interface SortButtonProps {
  label: string
  active: boolean
  direction: SortDirection
  onClick: () => void
  align?: 'start' | 'end'
}

function SortButton({ label, active, direction, onClick, align = 'start' }: SortButtonProps) {
  const { t } = useI18n()
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={onClick}
      className={align === 'end' ? '-mr-2' : '-ml-2'}
      aria-label={t(
        !active ? 'orders.sortBy' : direction === 'asc' ? 'orders.sortAscending' : 'orders.sortDescending',
        { label },
      )}
    >
      {label}
      <Icon data-icon="inline-end" className={active ? undefined : 'text-muted-foreground'} />
    </Button>
  )
}

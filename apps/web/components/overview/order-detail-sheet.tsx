'use client'

import { Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OrderStatusBadge } from '@/components/overview/order-status'
import { useI18n } from '@/components/providers/i18n-provider'
import type { Order } from '@/lib/types'

interface OrderDetailSheetProps {
  order: Order | null
  onOpenChange: (open: boolean) => void
  onRefund: (order: Order) => void
}

export function OrderDetailSheet({ order, onOpenChange, onRefund }: OrderDetailSheetProps) {
  const { t, format } = useI18n()

  return (
    <Sheet open={order !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">{order.invoiceNumber}</SheetTitle>
              <SheetDescription>{t('orderDetail.created', { date: format.dateTime(order.createdAt) })}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t('orderDetail.amount')}</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums">{format.cents(order.amount)}</span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <Separator />
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <DetailRow label={t('orderDetail.customer')} value={order.customer.name} />
                <DetailRow label={t('orderDetail.email')} value={order.customer.email} />
                <DetailRow label={t('orderDetail.organization')} value={order.organization} />
                <DetailRow
                  label={t('orderDetail.plan')}
                  value={`${order.plan} · ${t(`intervals.${order.interval}`)}`}
                />
                <DetailRow label={t('orderDetail.paymentMethod')} value={order.paymentMethod} />
                <DetailRow
                  label={t('orderDetail.orderId')}
                  value={<span className="font-mono text-xs">{order.id}</span>}
                />
              </dl>
            </div>
            <SheetFooter>
              <Button variant="outline" disabled={order.status !== 'paid'} onClick={() => onRefund(order)}>
                <Undo2 data-icon="inline-start" />
                {t('orderDetail.refundOrder')}
              </Button>
              {order.status !== 'paid' && (
                <p className="text-xs text-muted-foreground">{t('orderDetail.onlyPaid')}</p>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </>
  )
}

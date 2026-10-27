'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useI18n } from '@/components/providers/i18n-provider'
import { translateError } from '@/components/shared/error-state'
import { refundOrder } from '@/lib/api/overview'
import type { Order } from '@/lib/types'

interface RefundOrderDialogProps {
  order: Order | null
  onOpenChange: (open: boolean) => void
  onRefunded: (order: Order) => void
}

export function RefundOrderDialog({ order, onOpenChange, onRefunded }: RefundOrderDialogProps) {
  const { t, format } = useI18n()
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    if (!order) return
    setPending(true)
    try {
      const updated = await refundOrder(order.id)
      onRefunded(updated)
      toast.success(t('refund.success', { amount: format.cents(updated.amount) }), {
        description: `${updated.invoiceNumber} · ${updated.customer.name}`,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(t('refund.failed'), { description: translateError(t, error) })
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={order !== null} onOpenChange={(open) => !pending && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('refund.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {order
              ? t('refund.description', {
                  amount: format.cents(order.amount),
                  customer: order.customer.name,
                  method: order.paymentMethod,
                })
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t('common.cancel')}</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending && <Spinner data-icon="inline-start" />}
            {t('refund.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

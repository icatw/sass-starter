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
import { refundOrder } from '@/lib/api/overview'
import { formatCents } from '@/lib/format'
import type { Order } from '@/lib/types'

interface RefundOrderDialogProps {
  order: Order | null
  onOpenChange: (open: boolean) => void
  onRefunded: (order: Order) => void
}

export function RefundOrderDialog({ order, onOpenChange, onRefunded }: RefundOrderDialogProps) {
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    if (!order) return
    setPending(true)
    try {
      const updated = await refundOrder(order.id)
      onRefunded(updated)
      toast.success(`Refunded ${formatCents(updated.amount)}`, { description: `${updated.invoiceNumber} · ${updated.customer.name}` })
      onOpenChange(false)
    } catch (error) {
      toast.error('Refund failed', { description: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={order !== null} onOpenChange={(open) => !pending && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refund this order?</AlertDialogTitle>
          <AlertDialogDescription>
            {order
              ? `${formatCents(order.amount)} will be returned to ${order.customer.name} (${order.paymentMethod}). This cannot be undone.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending && <Spinner data-icon="inline-start" />}
            Refund
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

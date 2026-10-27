'use client'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { useI18n } from '@/components/providers/i18n-provider'
import type { OrderStatus } from '@/lib/types'

export const ORDER_STATUSES: OrderStatus[] = ['paid', 'pending', 'failed', 'refunded']

const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n()
  return <StatusBadge tone={ORDER_STATUS_TONE[status]}>{t(`orderStatus.${status}`)}</StatusBadge>
}

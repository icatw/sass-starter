import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import type { OrderStatus } from '@/lib/types'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS[status]
  return <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
}

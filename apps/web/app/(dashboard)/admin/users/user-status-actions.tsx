'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { updateAdminUserStatus, type AdminUserActionState } from './actions'

const initialState: AdminUserActionState = { error: '' }

export function UserStatusActions({
  userId,
  disabled,
  isSelf,
  labels,
}: {
  userId: string
  disabled: boolean
  isSelf: boolean
  labels: {
    disable: string
    restore: string
    saving: string
    selfForbidden: string
    lastAdmin: string
    saveFailed: string
  }
}) {
  const [state, action, pending] = useActionState(updateAdminUserStatus, initialState)

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">{labels.selfForbidden}</span>
  }

  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="disabled" value={disabled ? 'false' : 'true'} />
      <Button type="submit" size="sm" variant={disabled ? 'outline' : 'destructive'} disabled={pending}>
        {pending ? labels.saving : disabled ? labels.restore : labels.disable}
      </Button>
      {state.error ? (
        <span className="text-xs text-destructive" role="alert">
          {state.error === 'last-admin'
            ? labels.lastAdmin
            : state.error === 'self'
              ? labels.selfForbidden
              : labels.saveFailed}
        </span>
      ) : null}
    </form>
  )
}

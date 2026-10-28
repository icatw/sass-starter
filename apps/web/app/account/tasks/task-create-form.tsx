'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/components/providers/i18n-provider'
import { createTask, type TaskActionState } from './actions'

const initialState: TaskActionState = { error: '' }

export function TaskCreateForm() {
  const { t } = useI18n()
  const [state, formAction, pending] = useActionState(createTask, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="grid min-w-0 flex-1 gap-2">
        <Label htmlFor="task-title">{t('tasks.newTitle')}</Label>
        <Input id="task-title" name="title" maxLength={200} required disabled={pending} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? t('tasks.saving') : t('tasks.add')}</Button>
      {state.error ? (
        <p className="basis-full text-sm text-destructive" role="alert">
          {state.error === 'invalid-title' ? t('tasks.invalidTitle') : t('tasks.saveFailed')}
        </p>
      ) : null}
    </form>
  )
}

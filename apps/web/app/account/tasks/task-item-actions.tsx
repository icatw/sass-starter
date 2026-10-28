'use client'

import { useActionState } from 'react'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { deleteTask, updateTask, type TaskActionState } from './actions'

const initialState: TaskActionState = { error: '' }

export function TaskItemActions({ taskId, completed }: { taskId: string; completed: boolean }) {
  const { t } = useI18n()
  const [updateState, updateAction, updatePending] = useActionState(updateTask, initialState)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTask, initialState)

  return (
    <div className="flex shrink-0 items-center gap-2">
      <form action={updateAction}>
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="completed" value={String(!completed)} />
        <Button type="submit" variant="outline" size="sm" disabled={updatePending || deletePending}>
          {completed ? <RotateCcw data-icon="inline-start" /> : <Check data-icon="inline-start" />}
          {updatePending ? t('tasks.saving') : completed ? t('tasks.reopen') : t('tasks.complete')}
        </Button>
      </form>
      <form action={deleteAction}>
        <input type="hidden" name="taskId" value={taskId} />
        <Button type="submit" variant="ghost" size="icon-sm" aria-label={t('tasks.delete')} disabled={updatePending || deletePending}>
          <Trash2 />
        </Button>
      </form>
      {updateState.error || deleteState.error ? (
        <span className="basis-full text-xs text-destructive" role="alert">{t('tasks.saveFailed')}</span>
      ) : null}
    </div>
  )
}

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth/session'
import { getI18n } from '@/lib/i18n/server'
import { listMyTasks } from '@/lib/tasks/api'
import { TaskCreateForm } from './task-create-form'
import { TaskItemActions } from './task-item-actions'

export default async function TasksPage() {
  await requireUser()
  const { t } = await getI18n()
  let tasks: Awaited<ReturnType<typeof listMyTasks>> = []
  let loadFailed = false
  try {
    tasks = await listMyTasks()
  } catch {
    loadFailed = true
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <Button variant="ghost" size="sm" className="self-start" render={<Link href="/account" />} nativeButton={false}>
        <ArrowLeft data-icon="inline-start" />{t('tasks.backToAccount')}
      </Button>
      <PageHeader title={t('tasks.title')} description={t('tasks.description')} />
      <Card>
        <CardHeader><CardTitle>{t('tasks.addHeading')}</CardTitle></CardHeader>
        <CardContent><TaskCreateForm /></CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {loadFailed ? (
            <p className="p-6 text-sm text-destructive" role="alert">{t('tasks.loadFailed')}</p>
          ) : tasks.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t('tasks.empty')}</p>
          ) : (
            <ul className="divide-y">
              {tasks.map((task) => (
                <li key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className={task.completed ? 'break-words text-sm text-muted-foreground line-through' : 'break-words text-sm'}>
                    {task.title}
                  </span>
                  <TaskItemActions taskId={task.id} completed={task.completed} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

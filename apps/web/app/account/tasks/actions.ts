'use server'

import { revalidatePath } from 'next/cache'
import { getTaskApi } from '@/lib/tasks/api'

export type TaskActionState = { error: string }

export async function createTask(_previousState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const title = String(formData.get('title') ?? '').trim()
  const titleLength = [...title].length
  if (titleLength < 1 || titleLength > 200) return { error: 'invalid-title' }

  try {
    const api = await getTaskApi()
    const { error, response } = await api.POST('/v1/tasks', { body: { title } })
    if (!response.ok || error) return { error: 'save-failed' }
    revalidatePath('/account/tasks')
    return { error: '' }
  } catch {
    return { error: 'save-failed' }
  }
}

export async function updateTask(_previousState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const taskId = String(formData.get('taskId') ?? '')
  const completedValue = String(formData.get('completed') ?? '')
  if (!taskId || !['true', 'false'].includes(completedValue)) return { error: 'save-failed' }

  try {
    const api = await getTaskApi()
    const { error, response } = await api.PATCH('/v1/tasks/{taskId}', {
      params: { path: { taskId } },
      body: { completed: completedValue === 'true' },
    })
    if (!response.ok || error) return { error: 'save-failed' }
    revalidatePath('/account/tasks')
    return { error: '' }
  } catch {
    return { error: 'save-failed' }
  }
}

export async function deleteTask(_previousState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const taskId = String(formData.get('taskId') ?? '')
  if (!taskId) return { error: 'save-failed' }

  try {
    const api = await getTaskApi()
    const { error, response } = await api.DELETE('/v1/tasks/{taskId}', { params: { path: { taskId } } })
    if (!response.ok || error) return { error: 'save-failed' }
    revalidatePath('/account/tasks')
    return { error: '' }
  } catch {
    return { error: 'save-failed' }
  }
}

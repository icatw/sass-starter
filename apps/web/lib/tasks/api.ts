import 'server-only'
import { headers } from 'next/headers'
import { createApiClient, type components } from '@saas-starter/api-client'
import { auth } from '@/lib/auth/server'

export type Task = components['schemas']['Task']

export async function getTaskApi() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled) throw new Error('An active session is required')

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const origin = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL
  return createApiClient(process.env.API_INTERNAL_URL ?? 'http://localhost:8080', token, origin)
}

export async function listMyTasks() {
  const api = await getTaskApi()
  const { data, error, response } = await api.GET('/v1/tasks')
  if (!response.ok || error || !data) throw new Error(`Unable to load tasks (${response.status})`)
  return data.tasks
}

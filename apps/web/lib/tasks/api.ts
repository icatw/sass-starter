import 'server-only'
import { headers } from 'next/headers'
import { createApiClient, type components } from '@saas-starter/api-client'
import { auth } from '@/lib/auth/server'
import { getWebEnv } from '@/lib/env'

export type Task = components['schemas']['Task']

export async function getTaskApi() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled) throw new Error('An active session is required')

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const env = getWebEnv()
  return createApiClient(env.apiInternalURL, token, env.authURL)
}

export async function listMyTasks() {
  const api = await getTaskApi()
  const { data, error, response } = await api.GET('/v1/tasks')
  if (!response.ok || error || !data) throw new Error(`Unable to load tasks (${response.status})`)
  return data.tasks
}

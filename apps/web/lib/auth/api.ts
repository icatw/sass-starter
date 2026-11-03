import 'server-only'
import { headers } from 'next/headers'
import { createApiClient, type components } from '@saas-starter/api-client'
import { auth } from '@/lib/auth/server'
import { getWebEnv } from '@/lib/env'

export type AdminUser = components['schemas']['AdminUser']

export type AuditLogEvent = components['schemas']['AuditLogEvent']

export type AdminSettings = components['schemas']['AdminSettings']

export async function getAdminUsers(): Promise<AdminUser[]> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled || session.user.role !== 'admin') {
    throw new Error('An active administrator session is required')
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const env = getWebEnv()
  const api = createApiClient(env.apiInternalURL, token, env.authURL)
  const { data, error, response } = await api.GET('/v1/admin/users')

  if (!response.ok || error || !data) {
    throw new Error(`Go API user directory request failed with status ${response.status}`)
  }
  return data.users
}

export async function getAdminAuditLogs(): Promise<AuditLogEvent[]> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled || session.user.role !== 'admin') {
    throw new Error('An active administrator session is required')
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const env = getWebEnv()
  const api = createApiClient(env.apiInternalURL, token, env.authURL)
  const { data, error, response } = await api.GET('/v1/admin/audit-logs')

  if (!response.ok || error || !data) {
    throw new Error(`Go API audit log request failed with status ${response.status}`)
  }
  return data.events
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled || session.user.role !== 'admin') {
    throw new Error('An active administrator session is required')
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const env = getWebEnv()
  const api = createApiClient(env.apiInternalURL, token, env.authURL)
  const { data, error, response } = await api.GET('/v1/admin/settings')

  if (!response.ok || error || !data) {
    throw new Error(`Go API settings request failed with status ${response.status}`)
  }
  return data.settings
}

export async function getAdminApi() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled || session.user.role !== 'admin') {
    throw new Error('An active administrator session is required')
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const env = getWebEnv()
  return {
    api: createApiClient(env.apiInternalURL, token, env.authURL),
    actorId: session.user.id,
  }
}

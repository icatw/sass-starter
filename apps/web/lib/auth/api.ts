import 'server-only'
import { headers } from 'next/headers'
import { createApiClient, type components } from '@saas-starter/api-client'
import { auth } from '@/lib/auth/server'

export type AdminUser = components['schemas']['AdminUser']

export async function getAdminUsers(): Promise<AdminUser[]> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled || session.user.role !== 'admin') {
    throw new Error('An active administrator session is required')
  }

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const api = createApiClient(process.env.API_INTERNAL_URL ?? 'http://localhost:8080', token)
  const { data, error, response } = await api.GET('/v1/admin/users')

  if (!response.ok || error || !data) {
    throw new Error(`Go API user directory request failed with status ${response.status}`)
  }
  return data.users
}

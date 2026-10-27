import 'server-only'
import { headers } from 'next/headers'
import { createApiClient } from '@saas-starter/api-client'
import { auth } from '@/lib/auth/server'

export async function getApiProfile() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session || session.user.disabled) return null

  const { token } = await auth.api.getToken({ headers: requestHeaders })
  const api = createApiClient(process.env.API_INTERNAL_URL ?? 'http://localhost:8080', token)
  const { data, error, response } = await api.GET('/v1/me')

  if (!response.ok || error || !data) {
    throw new Error(`Go API profile request failed with status ${response.status}`)
  }
  return data
}

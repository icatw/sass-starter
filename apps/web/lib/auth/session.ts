import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server'

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireUser() {
  const session = await getServerSession()
  if (!session || session.user.disabled) redirect('/login')
  return session
}

export async function requireAdmin() {
  const session = await requireUser()
  if (session.user.role !== 'admin') redirect('/account')
  return session
}

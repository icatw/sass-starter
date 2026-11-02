'use server'

import { revalidatePath } from 'next/cache'
import { getAdminApi } from '@/lib/auth/api'

export type AdminUserActionState = { error: string }

export async function updateAdminUserStatus(
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const userId = String(formData.get('userId') ?? '')
  const disabledValue = String(formData.get('disabled') ?? '')
  if (!userId || !['true', 'false'].includes(disabledValue)) return { error: 'invalid' }

  try {
    const { api, actorId } = await getAdminApi()
    if (actorId === userId) return { error: 'self' }

    const { error, response } = await api.PATCH('/v1/admin/users/{userId}', {
      params: { path: { userId } },
      body: { disabled: disabledValue === 'true' },
    })
    if (response.status === 409) return { error: 'last-admin' }
    if (response.status === 403) return { error: 'forbidden' }
    if (response.status === 404) return { error: 'not-found' }
    if (!response.ok || error) return { error: 'save-failed' }

    revalidatePath('/admin/users')
    return { error: '' }
  } catch {
    return { error: 'save-failed' }
  }
}

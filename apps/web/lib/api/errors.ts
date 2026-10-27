import type { Messages } from '@/lib/i18n/dictionaries/en'
import type { MessageParams } from '@/lib/i18n/translator'

export type ApiErrorCode = Exclude<keyof Messages['errors'], 'unknown'>

/** Errors carry a stable code plus params so the UI can render them in the active locale. */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly params: MessageParams = {},
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

'use client'

import { createContext, useContext, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ApiError } from '@/lib/api/errors'
import { setLocaleCookie } from '@/lib/i18n/actions'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries/en'
import { createTranslator, type Translator } from '@/lib/i18n/translator'
import { createFormatter, type Formatter } from '@/lib/format'

interface I18nContextValue {
  locale: Locale
  messages: Messages
  t: Translator
  format: Formatter
  /** Translates ApiError codes; falls back to the raw message or a generic error. */
  errorMessage: (error: unknown) => string
  setLocale: (locale: Locale) => void
  isChangingLocale: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  locale: Locale
  messages: Messages
  children: React.ReactNode
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const router = useRouter()
  const [isChangingLocale, startTransition] = useTransition()

  const value = useMemo<I18nContextValue>(() => {
    const t = createTranslator(messages)
    return {
      locale,
      messages,
      t,
      format: createFormatter(locale),
      errorMessage(error) {
        if (error instanceof ApiError) return t(`errors.${error.code}`, error.params)
        if (error instanceof Error && error.message) return error.message
        return t('errors.unknown')
      },
      setLocale(next) {
        if (next === locale) return
        startTransition(async () => {
          await setLocaleCookie(next)
          router.refresh()
        })
      },
      isChangingLocale,
    }
  }, [locale, messages, router, isChangingLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

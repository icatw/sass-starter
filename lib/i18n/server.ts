import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { isLocale, LOCALE_COOKIE, matchLocale, type Locale } from '@/lib/i18n/config'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { createTranslator } from '@/lib/i18n/translator'
import { createFormatter } from '@/lib/format'

/** Resolves the request locale: explicit cookie first, then the browser's Accept-Language header. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie
  const headerStore = await headers()
  return matchLocale(headerStore.get('accept-language'))
})

export const getI18n = cache(async () => {
  const locale = await getLocale()
  const messages = dictionaries[locale]
  return {
    locale,
    messages,
    t: createTranslator(messages),
    format: createFormatter(locale),
  }
})

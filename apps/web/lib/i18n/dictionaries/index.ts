import type { Locale } from '@/lib/i18n/config'
import { en, type Messages } from '@/lib/i18n/dictionaries/en'
import { zhCN } from '@/lib/i18n/dictionaries/zh-CN'

export const dictionaries: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  en,
}

export type { Messages }

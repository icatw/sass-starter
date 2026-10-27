import type { Messages } from '@/lib/i18n/dictionaries/en'

/** Dot-separated paths to every string leaf in the dictionary, e.g. "orders.columns.amount". */
export type MessageKey<T = Messages> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends readonly unknown[]
      ? never
      : `${K}.${MessageKey<T[K]>}`
}[keyof T & string]

export type MessageParams = Record<string, string | number>

export type Translator = (key: MessageKey, params?: MessageParams) => string

function lookup(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[segment]
    return undefined
  }, messages)
}

/**
 * Creates a translator bound to one dictionary.
 * - `{name}` placeholders are replaced from `params`.
 * - When `params.count === 1` and a `<key>_one` entry exists, it is used instead (simple pluralization).
 */
export function createTranslator(messages: Messages): Translator {
  return (key, params) => {
    const singular = params?.count === 1 ? lookup(messages, `${key}_one`) : undefined
    const template = typeof singular === 'string' ? singular : lookup(messages, key)
    if (typeof template !== 'string') return key
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    )
  }
}

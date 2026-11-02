type AppEnv = 'development' | 'test' | 'production'

export type WebEnv = {
  appEnv: AppEnv
  appURL: string
  authURL: string
  authSecret: string
  databaseURL: string
  apiInternalURL: string
  authEmailMode: 'mailpit' | 'smtp'
  smtp: {
    host: string
    port: number
    from: string
    secure: boolean
    user?: string
    password?: string
  }
}

const PLACEHOLDER_SECRET = 'replace-with-a-random-secret-at-least-32-characters'

function readAppEnv(raw: string | undefined): AppEnv {
  const value = (raw ?? '').trim()
  if (!value) {
    if (process.env.NODE_ENV === 'production') return 'production'
    if (process.env.NODE_ENV === 'test') return 'test'
    return 'development'
  }
  if (value === 'development' || value === 'test' || value === 'production') return value
  throw new Error('APP_ENV must be one of development, test, production')
}

function requireAbsoluteHTTPURL(name: string, raw: string | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) throw new Error(`${name} is required`)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${name} must use http or https`)
  }
  return value.replace(/\/$/, '')
}

function requireDatabaseURL(raw: string | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) throw new Error('DATABASE_URL is required')
  try {
    // Accept postgres DSNs; URL parser is sufficient for basic shape checks.
    new URL(value)
  } catch {
    throw new Error('DATABASE_URL is invalid')
  }
  return value
}

function requireAuthSecret(raw: string | undefined, appEnv: AppEnv): string {
  const value = (raw ?? '').trim()
  if (!value || value.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters')
  }
  if (appEnv === 'production' && value === PLACEHOLDER_SECRET) {
    throw new Error('BETTER_AUTH_SECRET must be replaced before production use')
  }
  return value
}

function resolveAuthEmailMode(appEnv: AppEnv, raw: string | undefined): 'mailpit' | 'smtp' {
  const value = (raw ?? '').trim()
  if (!value) return appEnv === 'production' ? 'smtp' : 'mailpit'
  if (value !== 'mailpit' && value !== 'smtp') {
    throw new Error('AUTH_EMAIL_MODE must be mailpit or smtp')
  }
  if (appEnv === 'production' && value === 'mailpit') {
    throw new Error('AUTH_EMAIL_MODE=mailpit is not allowed in production')
  }
  return value
}

function resolveSMTP(source: NodeJS.ProcessEnv, appEnv: AppEnv, mode: 'mailpit' | 'smtp') {
  const allowMailpitDefaults = appEnv !== 'production' && mode === 'mailpit'
  const host = (source.SMTP_HOST ?? (allowMailpitDefaults ? '127.0.0.1' : '')).trim()
  const from = (source.SMTP_FROM ?? (allowMailpitDefaults ? 'SaaS Foundry <no-reply@localhost>' : '')).trim()
  const portRaw = (source.SMTP_PORT ?? (allowMailpitDefaults ? '1025' : '')).trim()
  const port = Number(portRaw)

  if (!host || !from || !portRaw || Number.isNaN(port) || port <= 0) {
    throw new Error('SMTP_HOST, SMTP_PORT and SMTP_FROM are required to send authentication email')
  }

  const user = (source.SMTP_USER ?? '').trim()
  const password = source.SMTP_PASSWORD ?? ''

  return {
    host,
    port,
    from,
    secure: source.SMTP_SECURE === 'true',
    user: user || undefined,
    password: user ? password : undefined,
  }
}

export function loadWebEnv(source: NodeJS.ProcessEnv = process.env): WebEnv {
  const appEnv = readAppEnv(source.APP_ENV)
  const authURL = requireAbsoluteHTTPURL(
    'BETTER_AUTH_URL',
    source.BETTER_AUTH_URL ?? source.NEXT_PUBLIC_APP_URL,
  )
  const appURL = requireAbsoluteHTTPURL(
    'NEXT_PUBLIC_APP_URL',
    source.NEXT_PUBLIC_APP_URL ?? source.BETTER_AUTH_URL,
  )
  const authEmailMode = resolveAuthEmailMode(appEnv, source.AUTH_EMAIL_MODE)

  return {
    appEnv,
    appURL,
    authURL,
    authSecret: requireAuthSecret(source.BETTER_AUTH_SECRET, appEnv),
    databaseURL: requireDatabaseURL(source.DATABASE_URL),
    apiInternalURL: requireAbsoluteHTTPURL('API_INTERNAL_URL', source.API_INTERNAL_URL ?? 'http://localhost:8080'),
    authEmailMode,
    smtp: resolveSMTP(source, appEnv, authEmailMode),
  }
}

let cached: WebEnv | undefined

export function getWebEnv(): WebEnv {
  if (!cached) cached = loadWebEnv()
  return cached
}

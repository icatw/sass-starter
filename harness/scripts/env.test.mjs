import assert from 'node:assert/strict'
import test from 'node:test'
import { loadWebEnv } from '../../apps/web/lib/env.ts'

const baseEnv = {
  APP_ENV: 'development',
  BETTER_AUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  BETTER_AUTH_SECRET: 'development-secret-with-at-least-32-characters',
  DATABASE_URL: 'postgres://saas:saas@localhost:5432/saas?sslmode=disable',
  API_INTERNAL_URL: 'http://localhost:8080',
  AUTH_EMAIL_MODE: 'mailpit',
}

test('loadWebEnv accepts development mailpit defaults', () => {
  const env = loadWebEnv(baseEnv)
  assert.equal(env.appEnv, 'development')
  assert.equal(env.smtp.host, '127.0.0.1')
  assert.equal(env.smtp.port, 1025)
})

test('loadWebEnv rejects production mailpit mode', () => {
  assert.throws(
    () =>
      loadWebEnv({
        ...baseEnv,
        APP_ENV: 'production',
        AUTH_EMAIL_MODE: 'mailpit',
      }),
    /mailpit is not allowed/,
  )
})

test('loadWebEnv requires smtp details in production', () => {
  assert.throws(
    () =>
      loadWebEnv({
        ...baseEnv,
        APP_ENV: 'production',
        AUTH_EMAIL_MODE: 'smtp',
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_FROM: '',
      }),
    /SMTP_HOST, SMTP_PORT and SMTP_FROM/,
  )
})

test('loadWebEnv rejects placeholder secret in production', () => {
  assert.throws(
    () =>
      loadWebEnv({
        ...baseEnv,
        APP_ENV: 'production',
        AUTH_EMAIL_MODE: 'smtp',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_FROM: 'SaaS Foundry <no-reply@example.com>',
        BETTER_AUTH_SECRET: 'replace-with-a-random-secret-at-least-32-characters',
      }),
    /replaced before production use/,
  )
})

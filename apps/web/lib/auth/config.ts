import { Pool } from 'pg'
import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'
import { sendAuthEmail } from '@/lib/auth/email'

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL
if (!baseURL) throw new Error('BETTER_AUTH_URL must be configured')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL must be configured')

const secret = process.env.BETTER_AUTH_SECRET
if (!secret || secret.length < 32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters')

const secureCookies = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  appName: 'SaaS Foundry',
  baseURL,
  basePath: '/api/auth',
  secret,
  trustedOrigins: [baseURL],
  database: new Pool({ connectionString: databaseUrl }),
  user: {
    modelName: 'users',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      role: {
        type: ['user', 'admin'],
        required: false,
        defaultValue: 'user',
        input: false,
      },
      disabled: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    modelName: 'sessions',
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
    },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: 'accounts',
    fields: {
      accountId: 'account_id',
      providerId: 'provider_id',
      userId: 'user_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  verification: {
    modelName: 'verifications',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: 'Reset your SaaS Foundry password',
        text: `Use this single-use link to reset your password within one hour:\n\n${url}`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: 'Verify your SaaS Foundry email',
        text: `Verify your email within one hour:\n\n${url}`,
      })
    },
  },
  rateLimit: {
    enabled: true,
    storage: 'database',
    modelName: 'rate_limits',
    fields: { lastRequest: 'last_request' },
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 15 * 60, max: 5 },
      '/sign-up/email': { window: 60 * 60, max: 5 },
      '/request-password-reset': { window: 60 * 60, max: 3 },
      '/send-verification-email': { window: 60 * 60, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: secureCookies,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      path: '/',
    },
    cookiePrefix: 'saas_foundry',
  },
  plugins: [
    jwt({
      disableSettingJwtHeader: true,
      jwks: {
        keyPairConfig: { alg: 'EdDSA', crv: 'Ed25519' },
        rotationInterval: 60 * 60 * 24 * 30,
        gracePeriod: 60 * 60 * 24,
      },
      jwt: {
        issuer: baseURL,
        audience: 'saas-api',
        expirationTime: '60s',
        definePayload: () => ({}),
      },
    }),
  ],
})

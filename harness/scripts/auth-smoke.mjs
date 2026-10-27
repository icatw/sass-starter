import assert from 'node:assert/strict'

const baseURL = (process.env.AUTH_SMOKE_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const apiURL = (process.env.API_INTERNAL_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const mailpitURL = (process.env.MAILPIT_URL ?? 'http://localhost:8025').replace(/\/$/, '')
const email = `auth-smoke-${Date.now()}@example.test`
const oldPassword = `Old-${Date.now()}-Pass!`
const newPassword = `New-${Date.now()}-Pass!`
const commonHeaders = { origin: baseURL, 'content-type': 'application/json' }

async function post(path, body, cookie) {
  const headers = { ...commonHeaders }
  if (cookie) headers.cookie = cookie
  return fetch(`${baseURL}${path}`, {
    method: 'POST', headers, body: JSON.stringify(body), redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  })
}

async function latestEmailForTestUser() {
  const list = await fetch(`${mailpitURL}/api/v1/messages`, { signal: AbortSignal.timeout(5000) }).then((response) => response.json())
  for (const row of list.messages ?? []) {
    const message = await fetch(`${mailpitURL}/api/v1/message/${row.ID}`, { signal: AbortSignal.timeout(5000) }).then((response) => response.json())
    if ((message.To ?? []).some((recipient) => recipient.Address === email)) return message
  }
  throw new Error('Mailpit did not capture the expected authentication message')
}

function linkFromEmail(message) {
  const raw = String(message.Text ?? '').match(/https?:\/\/[^\s<>"']+/)?.[0]
  assert.ok(raw, 'authentication message should contain an action link')
  return new URL(raw.replace(/[),.]$/, ''))
}

function cookieFrom(response) {
  const setCookies = response.headers.getSetCookie()
  const sessionCookie = setCookies.find((value) => /session_token=/.test(value))
  assert.ok(sessionCookie, 'sign-in should set a session token cookie')
  assert.match(sessionCookie, /;\s*httponly/i, 'session cookie must be HttpOnly')
  assert.match(sessionCookie, /;\s*samesite=lax/i, 'session cookie must use SameSite=Lax')
  assert.match(sessionCookie, /;\s*path=\//i, 'session cookie must use Path=/')
  assert.doesNotMatch(sessionCookie, /;\s*domain=/i, 'session cookie must not set Domain')
  if (process.env.NODE_ENV === 'production') assert.match(sessionCookie, /;\s*secure/i, 'production session cookie must be Secure')
  return setCookies.map((value) => value.split(';')[0]).join('; ')
}

const signup = await post('/api/auth/sign-up/email', {
  name: 'Auth Smoke', email, password: oldPassword, callbackURL: '/account', role: 'admin',
})
assert.equal(signup.status, 200, 'registration should succeed')
await signup.arrayBuffer()

const verifyLink = linkFromEmail(await latestEmailForTestUser())
const beforeVerificationLogin = await post('/api/auth/sign-in/email', { email, password: oldPassword })
assert.notEqual(beforeVerificationLogin.status, 200, 'unverified account must not sign in')
await beforeVerificationLogin.arrayBuffer()
const verifyResponse = await fetch(verifyLink, {
  redirect: 'manual', signal: AbortSignal.timeout(10000),
})
assert.ok([302, 303, 307].includes(verifyResponse.status), 'email verification link should redirect after use')
const reusedVerification = await fetch(verifyLink, { redirect: 'manual', signal: AbortSignal.timeout(10000) })
assert.notEqual(reusedVerification.status, 200, 'verification link must not be reusable')

const signIn = await post('/api/auth/sign-in/email', { email, password: oldPassword, callbackURL: '/account' })
assert.equal(signIn.status, 200, 'verified account should sign in')
const signInBody = await signIn.json()
assert.equal(signInBody.user.role, 'user', 'registration must not assign administrator role')
const sessionCookie = cookieFrom(signIn)
assert.ok(sessionCookie, 'sign-in should issue a session cookie')

const publicToken = await fetch(`${baseURL}/api/auth/token`, { headers: { cookie: sessionCookie }, redirect: 'manual' })
assert.equal(publicToken.status, 404, 'browser must not access internal JWT endpoint')
const account = await fetch(`${baseURL}/account`, { headers: { cookie: sessionCookie }, redirect: 'manual' })
assert.equal(account.status, 200, 'account page should fetch the authenticated Go profile')
assert.ok((await account.text()).includes(email), 'account page should render the Go profile')

const resetRequest = await post('/api/auth/request-password-reset', { email, redirectTo: '/reset-password/confirm' })
assert.equal(resetRequest.status, 200, 'password reset request should be accepted')
await resetRequest.arrayBuffer()
const resetPage = await fetch(linkFromEmail(await latestEmailForTestUser()), { redirect: 'manual' })
assert.ok([302, 303, 307].includes(resetPage.status), 'reset email link should redirect to the reset form')
const resetLocation = new URL(resetPage.headers.get('location'), baseURL)
assert.equal(resetLocation.pathname, '/reset-password/confirm')
const resetToken = resetLocation.searchParams.get('token')
assert.ok(resetToken, 'reset page link should carry the one-time token')

const reset = await post('/api/auth/reset-password', { newPassword, token: resetToken })
assert.equal(reset.status, 200, 'valid reset token should change the password')
await reset.arrayBuffer()
const staleSession = await fetch(`${baseURL}/api/auth/get-session`, { headers: { cookie: sessionCookie } }).then((response) => response.json())
assert.ok(!staleSession?.session, 'password reset should revoke existing sessions')
const reusedReset = await post('/api/auth/reset-password', { newPassword: `Again-${Date.now()}-Pass!`, token: resetToken })
assert.notEqual(reusedReset.status, 200, 'reset token must be single-use')
await reusedReset.arrayBuffer()

const oldPasswordLogin = await post('/api/auth/sign-in/email', { email, password: oldPassword })
assert.notEqual(oldPasswordLogin.status, 200, 'old password should stop working')
await oldPasswordLogin.arrayBuffer()
const newPasswordLogin = await post('/api/auth/sign-in/email', { email, password: newPassword })
assert.equal(newPasswordLogin.status, 200, 'new password should work')
const newCookie = cookieFrom(newPasswordLogin)
const signOut = await post('/api/auth/sign-out', {}, newCookie)
assert.equal(signOut.status, 200, 'sign-out should succeed')
const signedOutSession = await fetch(`${baseURL}/api/auth/get-session`, { headers: { cookie: newCookie } }).then((response) => response.json())
assert.ok(!signedOutSession?.session, 'signed-out session must be invalid')

const unauthorizedProfile = await fetch(`${apiURL}/v1/me`, { signal: AbortSignal.timeout(5000) })
assert.equal(unauthorizedProfile.status, 401, 'Go API should reject requests without an internal JWT')
console.log('Authentication smoke passed: verify, role isolation, login, server-side Go profile, reset, session revocation, single-use token, logout, unauthenticated API')

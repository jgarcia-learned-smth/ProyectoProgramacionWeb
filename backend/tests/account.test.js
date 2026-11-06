import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { hashSessionToken } from '../src/utils/auth.js'

const server = createApp().listen(0)
const { port } = server.address()
const baseUrl = `http://127.0.0.1:${port}`
let token

test.before(async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laura@example.com', password: 'demo-password' }),
  })
  token = (await response.json()).token
})

test.after(async () => {
  if (token) await prisma.session.delete({ where: { tokenHash: hashSessionToken(token) } }).catch(() => {})
  await prisma.$disconnect()
  server.close()
})

const auth = () => ({ Authorization: `Bearer ${token}` })

test('loads and updates the profile', async () => {
  const profile = await fetch(`${baseUrl}/api/me/profile`, { headers: auth() })
  const profilePayload = await profile.json()
  assert.equal(profile.status, 200)
  assert.equal(profilePayload.profile.email, 'laura@example.com')

  const update = await fetch(`${baseUrl}/api/me/profile`, {
    method: 'PATCH',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Laura C.', email: 'laura@example.com' }),
  })
  assert.equal(update.status, 200)
})

test('persists preferences and rejects invalid values', async () => {
  const update = await fetch(`${baseUrl}/api/me/preferences`, {
    method: 'PUT',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale: 'en', timezone: 'Europe/Madrid', notifications: false }),
  })
  assert.equal(update.status, 200)

  const read = await fetch(`${baseUrl}/api/me/preferences`, { headers: auth() })
  const payload = await read.json()
  assert.equal(payload.preferences.locale, 'en')
  assert.equal(payload.preferences.notifications, false)

  const invalid = await fetch(`${baseUrl}/api/me/preferences`, {
    method: 'PUT',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale: 'xx', timezone: 'Mars/Space', notifications: 'yes' }),
  })
  assert.equal(invalid.status, 422)
})

test('rejects invalid password changes without changing the session', async () => {
  const invalid = await fetch(`${baseUrl}/api/me/password`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'new-password', confirmPassword: 'new-password' }),
  })
  assert.equal(invalid.status, 401)

  const short = await fetch(`${baseUrl}/api/me/password`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'demo-password', newPassword: 'short', confirmPassword: 'short' }),
  })
  assert.equal(short.status, 422)

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: auth() })
  assert.equal(me.status, 200)
})

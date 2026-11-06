import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { createSessionToken, hashSessionToken } from '../src/utils/auth.js'

const server = createApp().listen(0)
const { port } = server.address()
const baseUrl = `http://127.0.0.1:${port}`

test.after(async () => {
  await prisma.$disconnect()
  server.close()
})

test('rejects unauthenticated access to /api/auth/me', async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error.code, 'UNAUTHENTICATED')
})

test('logs in, reads the current user, and logs out', async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laura@example.com', password: 'demo-password' }),
  })
  const loginPayload = await login.json()

  assert.equal(login.status, 200)
  assert.ok(loginPayload.token)
  assert.equal(loginPayload.user.email, 'laura@example.com')

  const currentUser = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginPayload.token}` },
  })
  assert.equal(currentUser.status, 200)

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${loginPayload.token}` },
  })
  assert.equal(logout.status, 204)

  const afterLogout = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginPayload.token}` },
  })
  assert.equal(afterLogout.status, 401)
})

test('rejects invalid credentials without revealing the user', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laura@example.com', password: 'wrong-password' }),
  })
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error.code, 'INVALID_CREDENTIALS')
})

test('rejects an expired session', async () => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'laura@example.com' } })
  const token = createSessionToken()
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() - 1000),
    },
  })

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error.code, 'SESSION_EXPIRED')
})

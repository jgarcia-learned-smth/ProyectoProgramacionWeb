import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { hashSessionToken } from '../src/utils/auth.js'

const server = createApp().listen(0)
const { port } = server.address()
const baseUrl = `http://127.0.0.1:${port}`
let token
let integrationId

test.before(async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laura@example.com', password: 'demo-password' }),
  })
  token = (await login.json()).token
  const catalog = await fetch(`${baseUrl}/api/integrations`, { headers: { Authorization: `Bearer ${token}` } })
  integrationId = (await catalog.json()).integrations[0].id
})

test.after(async () => {
  if (token) await prisma.session.delete({ where: { tokenHash: hashSessionToken(token) } }).catch(() => {})
  await prisma.$disconnect()
  server.close()
})

test('lists and persists integration connection state', async () => {
  const connect = await fetch(`${baseUrl}/api/integrations/${integrationId}/connect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const connected = await connect.json()
  assert.equal(connect.status, 200)
  assert.equal(connected.integration.connected, true)

  const disconnect = await fetch(`${baseUrl}/api/integrations/${integrationId}/disconnect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  assert.equal(disconnect.status, 200)
  assert.equal((await disconnect.json()).integration.connected, false)
})

test('lists and marks notifications as read', async () => {
  const list = await fetch(`${baseUrl}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
  const payload = await list.json()
  assert.equal(list.status, 200)
  assert.ok(payload.notifications.length > 0)

  const notification = payload.notifications[0]
  const read = await fetch(`${baseUrl}/api/notifications/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: notification.id }),
  })
  assert.equal(read.status, 200)

  const allRead = await fetch(`${baseUrl}/api/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  assert.equal(allRead.status, 204)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'

const server = createApp().listen(0)
const { port } = server.address()

test.after(() => {
  server.close()
})

test('GET /api/health returns the service status', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/health`)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.status, 'ok')
  assert.equal(payload.service, 'voltage-backend')
})

test('unknown endpoints return a structured 404 error', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/unknown`)
  const payload = await response.json()

  assert.equal(response.status, 404)
  assert.equal(payload.error.code, 'NOT_FOUND')
})

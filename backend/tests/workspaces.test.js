import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { hashSessionToken } from '../src/utils/auth.js'

const server = createApp().listen(0)
const { port } = server.address()
const baseUrl = `http://127.0.0.1:${port}`
let token
let columnId

test.before(async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laura@example.com', password: 'demo-password' }),
  })
  const payload = await response.json()
  token = payload.token
})

test.after(async () => {
  if (columnId) await prisma.column.delete({ where: { id: columnId } }).catch(() => {})
  if (token) await prisma.session.delete({ where: { tokenHash: hashSessionToken(token) } }).catch(() => {})
  await prisma.$disconnect()
  server.close()
})

test('requires authentication for the current workspace', async () => {
  const response = await fetch(`${baseUrl}/api/workspaces/current`)
  assert.equal(response.status, 401)
})

test('loads the current workspace with ordered columns and tasks', async () => {
  const response = await fetch(`${baseUrl}/api/workspaces/current`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.workspace.name, 'Product voltage')
  assert.equal(payload.workspace.columns.length, 4)
  assert.ok(payload.workspace.tasks.some((task) => task.id === 'task-design-system'))
  assert.equal(payload.workspace.tasks.find((task) => task.id === 'task-design-system').assignee, 'LC')
})

test('creates, renames, and deletes a column for an authorized member', async () => {
  const create = await fetch(`${baseUrl}/api/columns`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Pruebas', color: '#ffffff' }),
  })
  const created = await create.json()
  columnId = created.id

  assert.equal(create.status, 201)
  assert.equal(created.taskIds.length, 0)

  const rename = await fetch(`${baseUrl}/api/columns/${columnId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Pruebas actualizadas' }),
  })
  assert.equal(rename.status, 200)
  assert.equal((await rename.json()).title, 'Pruebas actualizadas')

  const remove = await fetch(`${baseUrl}/api/columns/${columnId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  assert.equal(remove.status, 204)
  columnId = null
})

test('rejects invalid column titles', async () => {
  const response = await fetch(`${baseUrl}/api/columns`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '   ' }),
  })
  const payload = await response.json()

  assert.equal(response.status, 422)
  assert.equal(payload.error.code, 'VALIDATION_ERROR')
})

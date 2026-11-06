import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db/prisma.js'
import { hashSessionToken } from '../src/utils/auth.js'

const server = createApp().listen(0)
const { port } = server.address()
const baseUrl = `http://127.0.0.1:${port}`
let token
let taskId

test.before(async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laura@example.com', password: 'demo-password' }),
  })
  token = (await response.json()).token
})

test.after(async () => {
  if (taskId) await prisma.task.delete({ where: { id: taskId } }).catch(() => {})
  if (token) await prisma.session.delete({ where: { tokenHash: hashSessionToken(token) } }).catch(() => {})
  await prisma.$disconnect()
  server.close()
})

const auth = () => ({ Authorization: `Bearer ${token}` })

test('creates, updates, moves, and deletes a task', async () => {
  const create = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Tarea de integración',
      column_id: 'backlog',
      priority: 'Alta',
      assignee: 'LC',
      description: 'Verificar el flujo completo.',
    }),
  })
  const created = await create.json()
  taskId = created.id

  assert.equal(create.status, 201)
  assert.equal(created.assignee, 'LC')

  const update = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Tarea actualizada', description: 'Contenido nuevo.' }),
  })
  assert.equal(update.status, 200)
  assert.equal((await update.json()).title, 'Tarea actualizada')

  const move = await fetch(`${baseUrl}/api/tasks/${taskId}/move`, {
    method: 'PATCH',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: 'review', position: 0 }),
  })
  assert.equal(move.status, 200)
  assert.equal((await move.json()).columnId, 'review')

  const remove = await fetch(`${baseUrl}/api/tasks/${taskId}`, { method: 'DELETE', headers: auth() })
  assert.equal(remove.status, 204)
  taskId = null
})

test('creates and lists a task comment', async () => {
  const task = await prisma.task.findUniqueOrThrow({ where: { id: 'task-design-system' } })
  const create = await fetch(`${baseUrl}/api/tasks/${task.id}/comments`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Comentario de prueba' }),
  })
  const comment = await create.json()

  assert.equal(create.status, 201)
  assert.equal(comment.author, 'LC')
  assert.equal(comment.text, 'Comentario de prueba')

  const list = await fetch(`${baseUrl}/api/tasks/${task.id}/comments`, { headers: auth() })
  const payload = await list.json()
  assert.equal(list.status, 200)
  assert.ok(payload.comments.some((item) => item.id === comment.id))

  await prisma.comment.delete({ where: { id: comment.id } })
})

test('rejects invalid task input', async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: ' ', column_id: 'backlog' }),
  })
  const payload = await response.json()

  assert.equal(response.status, 422)
  assert.equal(payload.error.code, 'VALIDATION_ERROR')
})

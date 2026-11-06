import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { getWorkspaceMembership } from '../middleware/workspace.js'
import { httpError } from '../utils/http.js'

const taskRouter = Router()
taskRouter.use(requireAuth)

const priorities = new Set(['Alta', 'Media', 'Baja'])

function initials(name) {
  return name ? name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() : null
}

function serializeTask(task) {
  return {
    ...task,
    assignee: initials(task.assignee?.name),
    comments: (task.comments || []).map((comment) => ({
      id: comment.id,
      author: comment.author,
      text: comment.text,
      createdAt: comment.createdAt,
    })),
  }
}

async function findTask(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: true, comments: { orderBy: { createdAt: 'asc' } } },
  })
  if (!task) throw httpError(404, 'TASK_NOT_FOUND', 'La tarea no existe.')
  return task
}

async function authorizeTask(userId, task) {
  await getWorkspaceMembership(userId, task.workspaceId)
}

async function resolveAssignee(assignee) {
  if (assignee === null || assignee === '') return null
  if (typeof assignee !== 'string') throw httpError(422, 'VALIDATION_ERROR', 'El asignado no es válido.')
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const user = users.find((item) => item.id === assignee || initials(item.name) === assignee.toUpperCase())
  if (!user) throw httpError(422, 'VALIDATION_ERROR', 'El usuario asignado no existe.')
  return user.id
}

async function resolveColumn(userId, columnId) {
  if (typeof columnId !== 'string' || !columnId) throw httpError(422, 'VALIDATION_ERROR', 'La columna es obligatoria.')
  const column = await prisma.column.findUnique({ where: { id: columnId } })
  if (!column) throw httpError(404, 'COLUMN_NOT_FOUND', 'La columna no existe.')
  await getWorkspaceMembership(userId, column.workspaceId)
  return column
}

function validateTaskInput(body, partial = false) {
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) throw httpError(422, 'VALIDATION_ERROR', 'El título de la tarea es obligatorio.')
    if (body.title.trim().length > 160) throw httpError(422, 'VALIDATION_ERROR', 'El título de la tarea es demasiado largo.')
  }
  if (body.priority !== undefined && !priorities.has(body.priority)) throw httpError(422, 'VALIDATION_ERROR', 'La prioridad no es válida.')
  if (body.description !== undefined && typeof body.description !== 'string') throw httpError(422, 'VALIDATION_ERROR', 'La descripción no es válida.')
}

const taskInclude = { assignee: true, comments: { orderBy: { createdAt: 'asc' } } }

taskRouter.post('/', async (request, response, next) => {
  try {
    validateTaskInput(request.body)
    const column = await resolveColumn(request.user.id, request.body.column_id)
    const last = await prisma.task.findFirst({ where: { columnId: column.id }, orderBy: { position: 'desc' } })
    const assigneeId = await resolveAssignee(request.body.assignee)
    const task = await prisma.task.create({
      data: {
        workspaceId: column.workspaceId,
        columnId: column.id,
        title: request.body.title.trim(),
        description: request.body.description || '',
        tag: typeof request.body.tag === 'string' && request.body.tag.trim() ? request.body.tag.trim() : 'Producto',
        priority: request.body.priority || 'Media',
        assigneeId,
        estimate: request.body.estimate || '0 pts',
        date: request.body.date || null,
        attachment: request.body.attachment || null,
        position: (last?.position ?? -1) + 1,
      },
      include: taskInclude,
    })
    response.status(201).json(serializeTask(task))
  } catch (error) {
    next(error)
  }
})

taskRouter.get('/:taskId/comments', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    await authorizeTask(request.user.id, task)
    const comments = await prisma.comment.findMany({ where: { taskId: task.id }, orderBy: { createdAt: 'asc' } })
    response.json({ comments })
  } catch (error) {
    next(error)
  }
})

taskRouter.post('/:taskId/comments', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    await authorizeTask(request.user.id, task)
    const text = typeof request.body?.text === 'string' ? request.body.text.trim() : ''
    if (!text) throw httpError(422, 'VALIDATION_ERROR', 'El comentario no puede estar vacío.')
    if (text.length > 2000) throw httpError(422, 'VALIDATION_ERROR', 'El comentario es demasiado largo.')
    const comment = await prisma.comment.create({
      data: { taskId: task.id, authorId: request.user.id, author: initials(request.user.name), text },
    })
    response.status(201).json(comment)
  } catch (error) {
    next(error)
  }
})

taskRouter.patch('/:taskId/move', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    await authorizeTask(request.user.id, task)
    const column = await resolveColumn(request.user.id, request.body?.column_id)
    if (column.workspaceId !== task.workspaceId) throw httpError(403, 'FORBIDDEN', 'La tarea y la columna pertenecen a workspaces distintos.')
    const requestedPosition = Number.isInteger(request.body?.position) ? request.body.position : 0
    const siblings = await prisma.task.findMany({ where: { columnId: column.id, id: { not: task.id } }, orderBy: { position: 'asc' } })
    const position = Math.max(0, Math.min(requestedPosition, siblings.length))
    const orderedIds = [...siblings.map((item) => item.id)]
    orderedIds.splice(position, 0, task.id)
    await prisma.$transaction(orderedIds.map((id, index) => prisma.task.update({ where: { id }, data: { columnId: column.id, position: index } })))
    const updated = await prisma.task.findUnique({ where: { id: task.id }, include: taskInclude })
    response.json(serializeTask(updated))
  } catch (error) {
    next(error)
  }
})

taskRouter.get('/:taskId', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    await authorizeTask(request.user.id, task)
    response.json(serializeTask(task))
  } catch (error) {
    next(error)
  }
})

taskRouter.patch('/:taskId/assignee', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    await authorizeTask(request.user.id, task)
    const assigneeId = await resolveAssignee(request.body?.assignee)
    const updated = await prisma.task.update({ where: { id: task.id }, data: { assigneeId }, include: taskInclude })
    response.json({ assignee: initials(updated.assignee?.name), ...serializeTask(updated) })
  } catch (error) {
    next(error)
  }
})

taskRouter.patch('/:taskId', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    await authorizeTask(request.user.id, task)
    validateTaskInput(request.body, true)
    const data = {}
    if (request.body.title !== undefined) data.title = request.body.title.trim()
    if (request.body.description !== undefined) data.description = request.body.description
    if (request.body.tag !== undefined) data.tag = request.body.tag
    if (request.body.priority !== undefined) data.priority = request.body.priority
    if (request.body.estimate !== undefined) data.estimate = request.body.estimate
    if (request.body.date !== undefined) data.date = request.body.date
    if (request.body.attachment !== undefined) data.attachment = request.body.attachment
    if (request.body.assignee !== undefined) data.assigneeId = await resolveAssignee(request.body.assignee)
    const updated = await prisma.task.update({ where: { id: task.id }, data, include: taskInclude })
    response.json(serializeTask(updated))
  } catch (error) {
    next(error)
  }
})

taskRouter.delete('/:taskId', async (request, response, next) => {
  try {
    const task = await findTask(request.params.taskId)
    const membership = await getWorkspaceMembership(request.user.id, task.workspaceId)
    if (!['owner', 'admin'].includes(membership.role)) throw httpError(403, 'FORBIDDEN', 'No tienes permiso para eliminar tareas.')
    await prisma.task.delete({ where: { id: task.id } })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default taskRouter

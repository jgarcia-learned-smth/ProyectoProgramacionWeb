import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { getWorkspaceMembership } from '../middleware/workspace.js'
import { httpError } from '../utils/http.js'

const columnRouter = Router()
columnRouter.use(requireAuth)

async function resolveWorkspaceId(request) {
  if (request.body?.workspace_id) return request.body.workspace_id
  const column = await prisma.column.findUnique({ where: { id: request.params.columnId } })
  if (!column) throw httpError(404, 'COLUMN_NOT_FOUND', 'La columna no existe.')
  return column.workspaceId
}

columnRouter.post('/', async (request, response, next) => {
  try {
    const workspaceId = request.body?.workspace_id || (await prisma.workspaceMember.findFirst({ where: { userId: request.user.id }, orderBy: { joinedAt: 'asc' } }))?.workspaceId
    if (!workspaceId) throw httpError(404, 'WORKSPACE_NOT_FOUND', 'No tienes un workspace disponible.')
    await getWorkspaceMembership(request.user.id, workspaceId)
    const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
    const color = typeof request.body?.color === 'string' ? request.body.color.trim() : '#D8D5CB'
    if (!title) throw httpError(422, 'VALIDATION_ERROR', 'El título de la columna es obligatorio.')
    if (title.length > 80) throw httpError(422, 'VALIDATION_ERROR', 'El título de la columna es demasiado largo.')
    const last = await prisma.column.findFirst({ where: { workspaceId }, orderBy: { position: 'desc' } })
    const column = await prisma.column.create({ data: { workspaceId, title, color, position: (last?.position ?? -1) + 1 } })
    response.status(201).json({ ...column, taskIds: [] })
  } catch (error) {
    next(error)
  }
})

columnRouter.patch('/:columnId', async (request, response, next) => {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    await getWorkspaceMembership(request.user.id, workspaceId)
    const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
    if (!title) throw httpError(422, 'VALIDATION_ERROR', 'El título de la columna es obligatorio.')
    if (title.length > 80) throw httpError(422, 'VALIDATION_ERROR', 'El título de la columna es demasiado largo.')
    const column = await prisma.column.update({ where: { id: request.params.columnId }, data: { title } })
    response.json({ ...column, taskIds: [] })
  } catch (error) {
    next(error)
  }
})

columnRouter.delete('/:columnId', async (request, response, next) => {
  try {
    const workspaceId = await resolveWorkspaceId(request)
    const membership = await getWorkspaceMembership(request.user.id, workspaceId)
    if (!['owner', 'admin'].includes(membership.role)) throw httpError(403, 'FORBIDDEN', 'Solo un administrador puede eliminar columnas.')
    await prisma.column.delete({ where: { id: request.params.columnId } })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default columnRouter

import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { getWorkspaceMembership } from '../middleware/workspace.js'
import { httpError } from '../utils/http.js'

const workspaceRouter = Router()
workspaceRouter.use(requireAuth)

function serializeTask(task) {
  const assigneeInitials = task.assignee?.name
    ? task.assignee.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : null
  return {
    ...task,
    assignee: assigneeInitials,
    comments: task.comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      text: comment.text,
      createdAt: comment.createdAt,
    })),
  }
}

function serializeWorkspace(workspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    columns: workspace.columns.map((column) => ({
      id: column.id,
      title: column.title,
      color: column.color,
      position: column.position,
      taskIds: column.tasks.sort((a, b) => a.position - b.position).map((task) => task.id),
    })),
    tasks: workspace.tasks.map(serializeTask),
  }
}

async function loadWorkspace(workspaceId) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      columns: { include: { tasks: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
      tasks: {
        include: { assignee: true, comments: { orderBy: { createdAt: 'asc' } } },
        orderBy: { position: 'asc' },
      },
    },
  })
}

workspaceRouter.get('/current', async (request, response, next) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: request.user.id },
      orderBy: { joinedAt: 'asc' },
    })
    if (!membership) throw httpError(404, 'WORKSPACE_NOT_FOUND', 'No tienes un workspace disponible.')
    const workspace = await loadWorkspace(membership.workspaceId)
    response.json({ workspace: serializeWorkspace(workspace) })
  } catch (error) {
    next(error)
  }
})

workspaceRouter.post('/', async (request, response, next) => {
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''
    if (!name) throw httpError(422, 'VALIDATION_ERROR', 'El nombre del workspace es obligatorio.')
    if (name.length > 100) throw httpError(422, 'VALIDATION_ERROR', 'El nombre del workspace es demasiado largo.')

    const workspace = await prisma.workspace.create({
      data: {
        name,
        memberships: { create: { userId: request.user.id, role: 'owner' } },
      },
    })
    response.status(201).json({ workspace: { id: workspace.id, name: workspace.name } })
  } catch (error) {
    next(error)
  }
})

workspaceRouter.get('/:workspaceId/members', async (request, response, next) => {
  try {
    await getWorkspaceMembership(request.user.id, request.params.workspaceId)
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: request.params.workspaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    })
    response.json({
      members: members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      })),
    })
  } catch (error) {
    next(error)
  }
})

export { loadWorkspace, serializeWorkspace }
export default workspaceRouter

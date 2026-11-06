import { prisma } from '../db/prisma.js'
import { httpError } from '../utils/http.js'

export async function getWorkspaceMembership(userId, workspaceId) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!membership) throw httpError(403, 'FORBIDDEN', 'No tienes acceso a este workspace.')
  return membership
}

export async function requireWorkspaceMembership(request, response, next) {
  try {
    const workspaceId = request.params.workspaceId || request.body?.workspace_id
    if (!workspaceId) {
      throw httpError(422, 'VALIDATION_ERROR', 'El workspace es obligatorio.')
    }
    request.membership = await getWorkspaceMembership(request.user.id, workspaceId)
    next()
  } catch (error) {
    next(error)
  }
}

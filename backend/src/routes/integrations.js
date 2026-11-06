import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { getWorkspaceMembership } from '../middleware/workspace.js'
import { httpError } from '../utils/http.js'

const integrationRouter = Router()
integrationRouter.use(requireAuth)

async function currentWorkspace(userId) {
  const membership = await prisma.workspaceMember.findFirst({ where: { userId }, orderBy: { joinedAt: 'asc' } })
  if (!membership) throw httpError(404, 'WORKSPACE_NOT_FOUND', 'No tienes un workspace disponible.')
  return membership
}

integrationRouter.get('/', async (request, response, next) => {
  try {
    const membership = await currentWorkspace(request.user.id)
    const integrations = await prisma.integration.findMany({ where: { workspaceId: membership.workspaceId }, orderBy: { name: 'asc' } })
    response.json({ integrations })
  } catch (error) {
    next(error)
  }
})

integrationRouter.post('/:integrationId/connect', async (request, response, next) => {
  try {
    const integration = await prisma.integration.findUnique({ where: { id: request.params.integrationId } })
    if (!integration) throw httpError(404, 'INTEGRATION_NOT_FOUND', 'La integración no existe.')
    await getWorkspaceMembership(request.user.id, integration.workspaceId)
    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: { connected: true, connectedAt: new Date() },
    })
    response.json({ integration: updated })
  } catch (error) {
    next(error)
  }
})

integrationRouter.post('/:integrationId/disconnect', async (request, response, next) => {
  try {
    const integration = await prisma.integration.findUnique({ where: { id: request.params.integrationId } })
    if (!integration) throw httpError(404, 'INTEGRATION_NOT_FOUND', 'La integración no existe.')
    await getWorkspaceMembership(request.user.id, integration.workspaceId)
    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: { connected: false, connectedAt: null },
    })
    response.json({ integration: updated })
  } catch (error) {
    next(error)
  }
})

export default integrationRouter

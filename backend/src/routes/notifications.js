import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { httpError } from '../utils/http.js'

const notificationRouter = Router()
notificationRouter.use(requireAuth)

notificationRouter.get('/', async (request, response, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    response.json({ notifications })
  } catch (error) {
    next(error)
  }
})

notificationRouter.post('/read-all', async (request, response, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: request.user.id, readAt: null }, data: { readAt: new Date() } })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

notificationRouter.post('/read', async (request, response, next) => {
  try {
    const id = typeof request.body?.id === 'string' ? request.body.id : ''
    if (!id) throw httpError(422, 'VALIDATION_ERROR', 'La notificación es obligatoria.')
    const notification = await prisma.notification.findFirst({ where: { id, userId: request.user.id } })
    if (!notification) throw httpError(404, 'NOTIFICATION_NOT_FOUND', 'La notificación no existe.')
    const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
    response.json({ notification: updated })
  } catch (error) {
    next(error)
  }
})

export default notificationRouter

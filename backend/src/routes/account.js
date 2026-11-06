import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { bcrypt, sanitizeUser } from '../utils/auth.js'
import { httpError } from '../utils/http.js'

const accountRouter = Router()
accountRouter.use(requireAuth)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const locales = new Set(['es', 'en'])
const timezones = new Set(['America/Caracas', 'America/New_York', 'Europe/Madrid'])

accountRouter.get('/profile', (request, response) => {
  response.json({ profile: sanitizeUser(request.user) })
})

accountRouter.patch('/profile', async (request, response, next) => {
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : ''
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
    if (!name || name.length > 100) throw httpError(422, 'VALIDATION_ERROR', 'El nombre debe tener entre 1 y 100 caracteres.')
    if (!emailPattern.test(email)) throw httpError(422, 'VALIDATION_ERROR', 'El correo electrónico no es válido.')

    const duplicate = await prisma.user.findFirst({ where: { email, id: { not: request.user.id } } })
    if (duplicate) throw httpError(409, 'EMAIL_IN_USE', 'Ese correo electrónico ya está en uso.')
    const user = await prisma.user.update({ where: { id: request.user.id }, data: { name, email } })
    response.json({ profile: sanitizeUser(user) })
  } catch (error) {
    next(error)
  }
})

accountRouter.post('/password', async (request, response, next) => {
  try {
    const currentPassword = typeof request.body?.currentPassword === 'string' ? request.body.currentPassword : ''
    const newPassword = typeof request.body?.newPassword === 'string' ? request.body.newPassword : ''
    const confirmPassword = typeof request.body?.confirmPassword === 'string' ? request.body.confirmPassword : ''
    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      throw httpError(422, 'VALIDATION_ERROR', 'La nueva contraseña debe tener al menos 8 caracteres y coincidir con su confirmación.')
    }
    if (currentPassword === newPassword) throw httpError(422, 'VALIDATION_ERROR', 'La nueva contraseña debe ser diferente.')
    if (!await bcrypt.compare(currentPassword, request.user.passwordHash)) {
      throw httpError(401, 'INVALID_PASSWORD', 'La contraseña actual no es válida.')
    }
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: request.user.id }, data: { passwordHash } })
    await prisma.session.deleteMany({ where: { userId: request.user.id, id: { not: request.session.id } } })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

accountRouter.get('/preferences', async (request, response, next) => {
  try {
    const preferences = await prisma.preference.findUnique({ where: { userId: request.user.id } })
    response.json({ preferences: preferences || { locale: 'es', timezone: 'America/Caracas', notifications: true } })
  } catch (error) {
    next(error)
  }
})

accountRouter.put('/preferences', async (request, response, next) => {
  try {
    const locale = request.body?.locale
    const timezone = request.body?.timezone
    const notifications = request.body?.notifications
    if (!locales.has(locale) || !timezones.has(timezone) || typeof notifications !== 'boolean') {
      throw httpError(422, 'VALIDATION_ERROR', 'Las preferencias no son válidas.')
    }
    const preferences = await prisma.preference.upsert({
      where: { userId: request.user.id },
      update: { locale, timezone, notifications },
      create: { userId: request.user.id, locale, timezone, notifications },
    })
    response.json({ preferences })
  } catch (error) {
    next(error)
  }
})

export default accountRouter

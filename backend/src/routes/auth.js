import { Router } from 'express'
import { env } from '../config/env.js'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { bcrypt, createSessionToken, hashSessionToken, sanitizeUser, sessionExpiry } from '../utils/auth.js'

const authRouter = Router()

authRouter.post('/login', async (request, response, next) => {
  try {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
    const password = typeof request.body?.password === 'string' ? request.body.password : ''
    if (!email || !password) {
      response.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'El correo y la contraseña son obligatorios.' } })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !passwordMatches) {
      response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'El correo o la contraseña no son válidos.' } })
      return
    }

    const token = createSessionToken()
    const expiresAt = sessionExpiry(env.sessionTtlHours)
    await prisma.session.create({
      data: { userId: user.id, tokenHash: hashSessionToken(token), expiresAt },
    })
    response.json({ token, user: sanitizeUser(user), expiresAt: expiresAt.toISOString() })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', requireAuth, async (request, response, next) => {
  try {
    await prisma.session.delete({ where: { id: request.session.id } })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({ user: sanitizeUser(request.user) })
})

export default authRouter

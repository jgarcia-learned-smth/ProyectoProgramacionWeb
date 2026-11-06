import { prisma } from '../db/prisma.js'
import { hashSessionToken } from '../utils/auth.js'

export async function requireAuth(request, response, next) {
  try {
    const header = request.get('authorization') || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      response.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Se requiere una sesión válida.' } })
      return
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    })
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } })
      response.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'La sesión ha expirado.' } })
      return
    }

    request.user = session.user
    request.session = session
    next()
  } catch (error) {
    next(error)
  }
}

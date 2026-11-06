import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function sessionExpiry(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export { bcrypt }

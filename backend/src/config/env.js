import 'dotenv/config'

const port = Number.parseInt(process.env.PORT || '8000', 10)
const sessionTtlHours = Number.parseInt(process.env.SESSION_TTL_HOURS || '24', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535.')
}
if (!Number.isInteger(sessionTtlHours) || sessionTtlHours < 1) {
  throw new Error('SESSION_TTL_HOURS debe ser un entero positivo.')
}

export const env = {
  port,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionTtlHours,
}

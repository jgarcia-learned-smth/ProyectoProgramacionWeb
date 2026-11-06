import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import workspaceRouter from './routes/workspaces.js'
import columnRouter from './routes/columns.js'
import taskRouter from './routes/tasks.js'
import accountRouter from './routes/account.js'
import integrationRouter from './routes/integrations.js'
import notificationRouter from './routes/notifications.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
  }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api', (request, response) => {
    response.json({ service: 'voltage-backend', status: 'ok' })
  })
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/workspaces', workspaceRouter)
  app.use('/api/columns', columnRouter)
  app.use('/api/tasks', taskRouter)
  app.use('/api/me', accountRouter)
  app.use('/api/integrations', integrationRouter)
  app.use('/api/notifications', notificationRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

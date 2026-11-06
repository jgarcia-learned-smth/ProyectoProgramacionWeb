import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/', (request, response) => {
  response.json({
    status: 'ok',
    service: 'voltage-backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

export default healthRouter

export function notFoundHandler(request, response) {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `No existe el endpoint ${request.method} ${request.originalUrl}.`,
    },
  })
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  console.error(error)
  response.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.statusCode ? error.message : 'Error interno del servidor.',
    },
  })
}

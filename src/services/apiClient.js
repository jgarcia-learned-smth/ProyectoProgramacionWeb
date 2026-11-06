const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, timeout = 15000, ...requestOptions } = options
  const session = !skipAuth ? getStoredSession() : null
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...requestOptions.headers,
  }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(`${BASE_URL}${path}`, { ...requestOptions, headers, signal: controller.signal })

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json') ? await response.json() : await response.text()

    if (!response.ok) {
      const message = typeof payload === 'object' && (payload?.detail || payload?.error?.message)
        ? payload.detail || payload.error.message
        : `La API respondió con el estado ${response.status}.`
      throw new ApiError(message, response.status, payload)
    }

    return response.status === 204 ? null : payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    const message = error.name === 'AbortError'
      ? 'La solicitud tardó demasiado. Comprueba la conexión e inténtalo de nuevo.'
      : 'No se pudo conectar con el backend. Comprueba que el servidor esté activo.'
    throw new ApiError(message, 0, error)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export { BASE_URL }

function getStoredSession() {
  try {
    const raw = window.localStorage.getItem('voltage.session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

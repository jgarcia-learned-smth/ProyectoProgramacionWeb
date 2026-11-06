import { apiRequest } from './apiClient.js'

const SESSION_KEY = 'voltage.session'

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export async function login(email, password) {
  const session = await apiRequest('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  })
  setSession(session)
  return session
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } finally {
    clearSession()
  }
}

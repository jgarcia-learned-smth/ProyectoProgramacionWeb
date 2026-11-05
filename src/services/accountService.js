import { apiRequest } from './apiClient.js'

export const getProfile = () => apiRequest('/me/profile')
export const updateProfile = (profile) => apiRequest('/me/profile', { method: 'PATCH', body: JSON.stringify(profile) })
export const changePassword = (passwords) => apiRequest('/me/password', { method: 'POST', body: JSON.stringify(passwords) })
export const getPreferences = () => apiRequest('/me/preferences')
export const updatePreferences = (preferences) => apiRequest('/me/preferences', { method: 'PUT', body: JSON.stringify(preferences) })
export const getIntegrations = () => apiRequest('/integrations')
export const connectIntegration = (integrationId) => apiRequest(`/integrations/${integrationId}/connect`, { method: 'POST' })

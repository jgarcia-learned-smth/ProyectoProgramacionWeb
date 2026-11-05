import { apiRequest } from './apiClient.js'

export const getWorkspace = (workspaceId = 'current') => apiRequest(`/workspaces/${workspaceId}`)
export const createTask = (task) => apiRequest('/tasks', { method: 'POST', body: JSON.stringify(task) })
export const updateTask = (taskId, changes) => apiRequest(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(changes) })
export const moveTask = (taskId, columnId, position) => apiRequest(`/tasks/${taskId}/move`, { method: 'PATCH', body: JSON.stringify({ column_id: columnId, position }) })
export const createColumn = (column) => apiRequest('/columns', { method: 'POST', body: JSON.stringify(column) })
export const addTaskComment = (taskId, comment) => apiRequest(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(comment) })
export const assignTaskRole = (taskId, assignee) => apiRequest(`/tasks/${taskId}/assignee`, { method: 'PATCH', body: JSON.stringify({ assignee }) })

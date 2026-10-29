const delay = (value, milliseconds = 500) => new Promise((resolve) => window.setTimeout(() => resolve(value), milliseconds))

export const saveTask = (task) => delay({ ...task, savedAt: new Date().toISOString() })
export const addTaskComment = (taskId, comment) => delay({ taskId, ...comment, id: `comment-${Date.now()}` }, 650)
export const assignTaskRole = (taskId, assignee) => delay({ taskId, assignee }, 450)

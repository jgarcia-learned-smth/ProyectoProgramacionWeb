import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createColumn, createTask, getWorkspace, moveTask as moveTaskRequest, addTaskComment as addTaskCommentRequest, assignTaskRole as assignTaskRoleRequest, updateTask as updateTaskRequest } from '../services/taskService.js'

const emptyState = { columns: {}, tasks: {} }
const WorkspaceContext = createContext(null)

function normalizeWorkspace(payload) {
  const source = payload?.workspace || payload || {}
  const columns = Array.isArray(source.columns)
    ? Object.fromEntries(source.columns.map((column) => [column.id, { ...column, taskIds: column.taskIds || column.tasks?.map((task) => task.id) || [] }]))
    : source.columns || {}
  const tasks = Array.isArray(source.tasks)
    ? Object.fromEntries(source.tasks.map((task) => [task.id, task]))
    : source.tasks || {}
  return { columns, tasks }
}

export function WorkspaceProvider({ children }) {
  const [state, setState] = useState(emptyState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState('')

  const notify = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const workspace = await getWorkspace()
      setState(normalizeWorkspace(workspace))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  const runAction = useCallback(async (operation) => {
    setError(null)
    try {
      return await operation()
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [])

  const addTask = useCallback(async (columnId) => runAction(async () => {
    const task = await createTask({ title: 'Nueva tarea conectada', tag: 'Producto', priority: 'Media', assignee: 'LC', estimate: '3 pts', date: '25 JUN', column_id: columnId, description: 'Añade el contexto de esta nueva tarea.' })
    setState((current) => ({ columns: { ...current.columns, [columnId]: { ...current.columns[columnId], taskIds: [...current.columns[columnId].taskIds, task.id] } }, tasks: { ...current.tasks, [task.id]: task } }))
    notify('Tarea creada en el workspace')
    return task
  }), [notify, runAction])

  const moveTask = useCallback(async (taskId, columnId, beforeTaskId = null) => runAction(async () => {
    const currentColumn = Object.values(state.columns).find((column) => column.taskIds.includes(taskId))
    const targetIds = state.columns[columnId]?.taskIds.filter((id) => id !== taskId) || []
    const position = beforeTaskId ? targetIds.indexOf(beforeTaskId) : targetIds.length
    await moveTaskRequest(taskId, columnId, position < 0 ? targetIds.length : position)
    setState((current) => {
      const columns = Object.fromEntries(Object.entries(current.columns).map(([id, column]) => [id, { ...column, taskIds: column.taskIds.filter((id) => id !== taskId) }]))
      const ids = [...columns[columnId].taskIds]
      ids.splice(position < 0 ? ids.length : position, 0, taskId)
      columns[columnId] = { ...columns[columnId], taskIds: ids }
      return { ...current, columns }
    })
    return currentColumn
  }), [runAction, state.columns])

  const addColumn = useCallback(async () => runAction(async () => {
    const column = await createColumn({ title: 'Nueva columna', color: '#D8D5CB' })
    setState((current) => ({ ...current, columns: { ...current.columns, [column.id]: { ...column, taskIds: column.taskIds || [] } } }))
    notify('Columna creada en el workspace')
    return column
  }), [notify, runAction])

  const updateTask = useCallback(async (task) => runAction(async () => {
    const updatedTask = await updateTaskRequest(task.id, task)
    setState((current) => ({ ...current, tasks: { ...current.tasks, [task.id]: { ...current.tasks[task.id], ...updatedTask } } }))
    return updatedTask
  }), [runAction])

  const addTaskComment = useCallback(async (taskId, comment) => runAction(async () => {
    const createdComment = await addTaskCommentRequest(taskId, comment)
    setState((current) => ({ ...current, tasks: { ...current.tasks, [taskId]: { ...current.tasks[taskId], comments: [...(current.tasks[taskId].comments || []), createdComment] } } }))
    return createdComment
  }), [runAction])

  const assignTaskRole = useCallback(async (taskId, assignee) => runAction(async () => {
    const result = await assignTaskRoleRequest(taskId, assignee)
    setState((current) => ({ ...current, tasks: { ...current.tasks, [taskId]: { ...current.tasks[taskId], assignee: result.assignee } } }))
    return result
  }), [runAction])

  const value = useMemo(() => ({ state, isLoading, error, toast, notify, loadWorkspace, addTask, moveTask, addColumn, updateTask, addTaskComment, assignTaskRole }), [state, isLoading, error, toast, notify, loadWorkspace, addTask, moveTask, addColumn, updateTask, addTaskComment, assignTaskRole])

  return <WorkspaceContext.Provider value={value}>{children}{toast && <div className="fixed bottom-7 right-8 z-50 rounded-xl bg-carbon px-4 py-3 text-sm font-medium text-white shadow-xl">{toast}</div>}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace debe utilizarse dentro de WorkspaceProvider')
  return context
}

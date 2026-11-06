import { CalendarDays, Clock3, Filter, GripVertical, LayoutDashboard, MoreHorizontal, Paperclip, Plus, Search } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Button, EmptyState } from '../components/Shared.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'

export default function BoardFrame({ setSelectedTask }) {
  const { state, isLoading, error, notify, loadWorkspace, moveTask, addTask, addColumn, renameColumn, deleteColumn } = useWorkspace()
  const [draggedTask, setDraggedTask] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('Todas')

  const filteredTasks = useMemo(() => Object.fromEntries(Object.entries(state.tasks).filter(([, task]) => {
    const matchesSearch = !searchTerm.trim() || `${task.title} ${task.tag} ${task.assignee}`.toLowerCase().includes(searchTerm.trim().toLowerCase())
    const matchesPriority = priorityFilter === 'Todas' || task.priority === priorityFilter
    return matchesSearch && matchesPriority
  })), [priorityFilter, searchTerm, state.tasks])

  const handleCreateTask = useCallback((columnId) => {
    void addTask(columnId).catch((requestError) => notify(requestError.message))
  }, [addTask, notify])

  const handleCreateColumn = useCallback(() => {
    void addColumn().catch((requestError) => notify(requestError.message))
  }, [addColumn, notify])

  const handleRenameColumn = useCallback(async (column) => {
    const title = window.prompt('Nuevo nombre de la columna', column.title)?.trim()
    if (title && title !== column.title) {
      try {
        await renameColumn(column.id, title)
      } catch (requestError) {
        notify(requestError.message)
      }
    }
  }, [notify, renameColumn])

  const handleDeleteColumn = useCallback(async (column) => {
    if (!window.confirm(`¿Eliminar la columna "${column.title}" y sus tareas?`)) return
    try {
      await deleteColumn(column.id)
    } catch (requestError) {
      notify(requestError.message)
    }
  }, [deleteColumn, notify])

  if (isLoading) return <EmptyState title="Conectando el tablero" description="Cargando el flujo de energía desde FastAPI." />
  if (error) return <EmptyState title="No hay conexión con el workspace" description={error.message} action={<Button onClick={loadWorkspace}>Reintentar conexión</Button>} />
  const firstColumnId = Object.keys(state.columns)[0]
  if (!firstColumnId) return <EmptyState title="No hay flujo de energía en este sprint" description="Conecta nuevas tareas para generar carga." action={<Button onClick={handleCreateColumn}>Crear primera columna</Button>} />

  const hasVisibleTasks = Object.values(state.columns).some((column) => column.taskIds.some((taskId) => filteredTasks[taskId]))

  return <><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><button className="filter-button active" type="button"><LayoutDashboard size={14} /> Kanban</button><Link className="filter-button" to="/gantt"><CalendarDays size={14} /> Gantt</Link></div><div className="flex items-center gap-2 text-xs text-carbon/50">{searchOpen && <input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar tareas..." className="w-40 rounded-lg border border-ground bg-white px-3 py-2 text-xs outline-none focus:border-voltage" />}<button className={`icon-button ${searchOpen ? 'bg-voltage' : ''}`} aria-label="Buscar tareas" type="button" onClick={() => setSearchOpen((open) => !open)}><Search size={16} /></button><label className="flex items-center gap-1"><Filter size={15} /><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filtrar por prioridad" className="rounded-lg border border-ground bg-white px-2 py-2 text-xs"><option>Todas</option><option>Alta</option><option>Media</option><option>Baja</option></select></label><span className="ml-2">Actualizado hace 2 min</span></div></div>{!hasVisibleTasks ? <EmptyState title="No hay tareas con esta carga" description="Prueba con otro término o cambia el filtro de prioridad." action={<Button variant="secondary" onClick={() => { setSearchTerm(''); setPriorityFilter('Todas') }}>Limpiar filtros</Button>} /> : <div className="grid grid-cols-4 gap-4">{Object.values(state.columns).map((column) => <Column key={column.id} column={column} tasks={filteredTasks} draggedTask={draggedTask} setDraggedTask={setDraggedTask} moveTask={moveTask} setSelectedTask={setSelectedTask} addTask={handleCreateTask} notify={notify} onRename={handleRenameColumn} onDelete={handleDeleteColumn} />)}<button type="button" onClick={handleCreateColumn} className="kanban-column flex min-h-0 items-center justify-center border border-dashed border-ground bg-transparent text-xs font-bold text-carbon/45 transition hover:bg-white"><Plus size={15} /> Añadir columna</button></div>}</>
}

function Column({ column, tasks, draggedTask, setDraggedTask, moveTask, setSelectedTask, addTask, notify, onRename, onDelete }) {
  const handleMove = useCallback((taskId, beforeTaskId = null) => {
    void moveTask(taskId, column.id, beforeTaskId).catch((requestError) => notify(requestError.message))
  }, [column.id, moveTask, notify])
  const handleDrop = useCallback(() => {
    if (draggedTask) handleMove(draggedTask)
    setDraggedTask(null)
  }, [draggedTask, handleMove, setDraggedTask])
  const handleDropBefore = useCallback((taskId) => {
    if (draggedTask) handleMove(draggedTask, taskId)
    setDraggedTask(null)
  }, [draggedTask, handleMove, setDraggedTask])
  const handleSelect = useCallback((taskId) => setSelectedTask(taskId), [setSelectedTask])

  return <section className={`kanban-column ${draggedTask ? 'drag-active' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} /><h3 className="text-sm font-bold">{column.title}</h3><span className="rounded-md bg-carbon/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-carbon/45">{column.taskIds.filter((id) => tasks[id]).length}</span></div><div className="relative"><details><summary className="icon-button list-none cursor-pointer" aria-label={`Opciones de ${column.title}`}><MoreHorizontal size={17} /></summary><div className="absolute right-0 z-10 mt-2 w-32 rounded-lg border border-ground bg-white p-1 text-xs shadow-lg"><button type="button" className="block w-full rounded px-2 py-2 text-left hover:bg-paper" onClick={() => onRename(column)}>Renombrar</button><button type="button" className="block w-full rounded px-2 py-2 text-left text-red-700 hover:bg-paper" onClick={() => onDelete(column)}>Eliminar</button></div></details></div></div><div className="space-y-3">{column.taskIds.filter((id) => tasks[id]).map((id) => <TaskCard key={id} task={tasks[id]} onSelect={handleSelect} onDragStart={setDraggedTask} onDragEnd={() => setDraggedTask(null)} onDropBefore={handleDropBefore} />)}{!column.taskIds.some((id) => tasks[id]) && <p className="rounded-xl border border-dashed border-ground px-3 py-8 text-center text-xs text-carbon/40">No hay flujo de energía en este sprint</p>}</div><Button variant="secondary" onClick={() => addTask(column.id)}><Plus size={14} /> Añadir tarea</Button></section>
}

const TaskCard = React.memo(function TaskCard({ task, onSelect, onDragStart, onDragEnd, onDropBefore }) {
  const handleDrop = useCallback((event) => {
    event.stopPropagation()
    onDropBefore(task.id)
  }, [onDropBefore, task.id])
  const handleSelect = useCallback(() => onSelect(task.id), [onSelect, task.id])

  return <article role="button" tabIndex="0" draggable onDragStart={() => onDragStart(task.id)} onDragEnd={onDragEnd} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={handleSelect} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSelect() } }} className="task-card group cursor-grab active:cursor-grabbing"><div className="mb-3 flex items-start justify-between gap-3"><span className={`tag ${task.tag === 'Frontend' ? 'tag-yellow' : task.tag === 'Backend' ? 'tag-blue' : ''}`}>{task.tag}</span><GripVertical size={15} className="text-carbon/20 opacity-0 transition group-hover:opacity-100" /></div><h4 className="mb-4 text-[13px] font-semibold leading-5">{task.title}</h4><div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-carbon/40"><Clock3 size={13} /> {task.estimate}<span className="text-ground">•</span><span className={task.priority === 'Alta' ? 'text-[#d48b43]' : ''}>{task.priority}</span></div><div className="flex items-center justify-between border-t border-ground/70 pt-3"><div className="flex items-center gap-2"><Avatar initials={task.assignee} className="h-6 w-6 text-[9px]" /><span className="text-[10px] font-bold text-carbon/45">{task.date}</span></div><Paperclip size={13} className="text-carbon/30" /></div></article>
})

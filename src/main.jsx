import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { X } from 'lucide-react'
import { initialState } from './app-data.jsx'
import { Avatar, Button, IconButton } from './components/Shared.jsx'
import Layout from './components/Layout.jsx'
import { addTaskComment, assignTaskRole, saveTask } from './services/mockApi.js'
import BoardFrame from './frames/BoardFrame.jsx'
import GanttFrame from './frames/GanttFrame.jsx'
import IntegrationsFrame from './frames/IntegrationsFrame.jsx'
import SettingsFrame from './frames/SettingsFrame.jsx'
import ProfileFrame from './frames/ProfileFrame.jsx'
import './styles.css'

function App() {
  const [state, setState] = useState(initialState)
  const [selectedTask, setSelectedTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [toast, setToast] = useState('')
  const totalTasks = useMemo(() => Object.keys(state.tasks).length, [state.tasks])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const addTask = (columnId) => {
    const id = `task-${Date.now()}`
    setState((current) => ({
      columns: { ...current.columns, [columnId]: { ...current.columns[columnId], taskIds: [...current.columns[columnId].taskIds, id] } },
      tasks: { ...current.tasks, [id]: { id, title: 'Nueva tarea conectada', tag: 'Producto', priority: 'Media', assignee: 'LC', estimate: '3 pts', date: '25 JUN', description: 'Añade el contexto de esta nueva tarea.' } },
    }))
    notify('Tarea conectada al backlog')
  }

  const moveTask = (taskId, columnId, beforeTaskId = null) => {
    setState((current) => {
      const columns = Object.fromEntries(Object.entries(current.columns).map(([id, column]) => [id, { ...column, taskIds: column.taskIds.filter((task) => task !== taskId) }]))
      const taskIds = [...columns[columnId].taskIds]
      const position = beforeTaskId ? taskIds.indexOf(beforeTaskId) : -1
      taskIds.splice(position < 0 ? taskIds.length : position, 0, taskId)
      columns[columnId] = { ...columns[columnId], taskIds }
      return { ...current, columns }
    })
  }

  const addColumn = () => {
    const id = `column-${Date.now()}`
    setState((current) => ({ ...current, columns: { ...current.columns, [id]: { id, title: 'Nueva columna', color: '#D8D5CB', taskIds: [] } } }))
    notify('Columna personalizable creada')
  }

  const updateTask = (task) => setState((current) => ({ ...current, tasks: { ...current.tasks, [task.id]: task } }))

  return <BrowserRouter><Layout totalTasks={totalTasks} notify={notify} addTask={addTask}><Routes><Route path="/board" element={<BoardFrame state={state} notify={notify} setSelectedTask={setSelectedTask} draggedTask={draggedTask} setDraggedTask={setDraggedTask} moveTask={moveTask} addTask={addTask} addColumn={addColumn} />} /><Route path="/gantt" element={<GanttFrame state={state} notify={notify} />} /><Route path="/integrations" element={<IntegrationsFrame notify={notify} />} /><Route path="/settings" element={<SettingsFrame notify={notify} />} /><Route path="/profile" element={<ProfileFrame notify={notify} />} /><Route path="/" element={<Navigate to="/board" replace />} /><Route path="*" element={<Navigate to="/board" replace />} /></Routes></Layout>{toast && <div className="fixed bottom-7 right-8 z-50 rounded-xl bg-carbon px-4 py-3 text-sm font-medium text-white shadow-xl">{toast}</div>}{selectedTask && <TaskModal task={state.tasks[selectedTask]} close={() => setSelectedTask(null)} updateTask={updateTask} notify={notify} />}</BrowserRouter>
}

function TaskModal({ task, close, updateTask, notify }) {
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState(task.description)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(task.comments || [])
  const [assignee, setAssignee] = useState(task.assignee)
  const [attachment, setAttachment] = useState('')
  const save = async () => { setSaving(true); const saved = await saveTask({ ...task, description, assignee, attachment }); updateTask(saved); setSaving(false); close(); notify('Tarea guardada en el mock') }
  const addComment = async () => { if (!comment.trim()) return; const next = await addTaskComment(task.id, { author: 'LC', text: comment.trim() }); setComments((current) => [...current, next]); setComment('') }
  const assign = async (value) => { setAssignee(value); const result = await assignTaskRole(task.id, value); updateTask({ ...task, assignee: result.assignee }) }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-carbon/30 p-6 backdrop-blur-sm" onClick={close}><div className="w-full max-w-[660px] rounded-2xl border border-ground bg-paper p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-start justify-between"><div><span className="tag tag-yellow">{task.tag}</span><h2 className="mt-3 font-display text-2xl font-semibold">{task.title}</h2></div><IconButton aria-label="Cerrar tarea" onClick={close}><X size={17} /></IconButton></div><div className="mb-5 flex items-center gap-5 border-y border-ground py-4 text-xs text-carbon/55"><label className="flex items-center gap-2">Asignado<select value={assignee} onChange={(event) => assign(event.target.value)} className="rounded-lg border border-ground bg-white px-2 py-1 text-xs font-bold text-carbon"><option value="LC">Laura C.</option><option value="JP">José P.</option><option value="MS">María S.</option><option value="AR">Andrés R.</option></select></label><span>{task.estimate}</span><span>{task.date}</span></div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-carbon/45">Descripción enriquecida</label><div className="rounded-xl border border-ground bg-white p-4"><div className="mb-3 flex items-center gap-4 border-b border-ground pb-3 text-xs font-bold text-carbon/55"><button onClick={() => setDescription((value) => `**${value}**`)}>B</button><button onClick={() => setDescription((value) => `_${value}_`)}><i>I</i></button><button onClick={() => setDescription((value) => `${value} @JP`)} className="text-voltage">@ mención</button><label className="cursor-pointer">Adjuntar<input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0]?.name || '')} /></label></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full resize-y bg-transparent text-sm leading-6 text-carbon/75 outline-none" />{attachment && <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs text-carbon/55">Adjunto: {attachment}</p>}</div><div className="mt-5 border-t border-ground pt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-carbon/45">Colaboración y comentarios</p><div className="mb-3 space-y-2">{comments.map((item) => <div key={item.id} className="flex gap-2 rounded-lg bg-white p-2 text-xs"><Avatar initials={item.author} className="h-6 w-6 text-[9px]" /><span>{item.text}</span></div>)}</div><div className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addComment() }} placeholder="Escribe una actualización..." className="min-w-0 flex-1 rounded-lg border border-ground bg-white px-3 py-2 text-xs outline-none focus:border-voltage" /><Button variant="secondary" onClick={addComment}>Comentar</Button></div></div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={close} disabled={saving}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button></div></div></div>
}

const rootElement = document.getElementById('root')
const appRoot = window.__voltageRoot || createRoot(rootElement)
window.__voltageRoot = appRoot
appRoot.render(<App />)

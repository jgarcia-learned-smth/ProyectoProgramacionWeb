import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, Archive, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, Command, Filter, GripVertical, LayoutDashboard,
  ListFilter, MessageCircle, MoreHorizontal, Paperclip, Pencil, PlugZap,
  Plus, Search, Settings2, Sparkles, Target, Users, X, Zap,
} from 'lucide-react'
import './styles.css'

const initialState = {
  columns: {
    backlog: { id: 'backlog', title: 'Backlog', color: '#B9B7AF', taskIds: ['voltage', 'research'] },
    progress: { id: 'progress', title: 'En progreso', color: '#FAD749', taskIds: ['dashboard', 'api'] },
    review: { id: 'review', title: 'En revisión', color: '#A7C8B8', taskIds: ['auth'] },
    done: { id: 'done', title: 'Listo', color: '#8D9BA8', taskIds: ['release'] },
  },
  tasks: {
    voltage: { id: 'voltage', title: 'Definir tokens de diseño voltage', tag: 'Diseño', priority: 'Alta', assignee: 'LC', estimate: '3 pts', date: '18 JUN', description: 'Crear la base visual del sistema: color spark, border ground y escalas tipográficas.' },
    research: { id: 'research', title: 'Auditar flujo de onboarding', tag: 'Producto', priority: 'Media', assignee: 'MS', estimate: '5 pts', date: '20 JUN', description: 'Revisar los puntos de fricción y documentar oportunidades de mejora.' },
    dashboard: { id: 'dashboard', title: 'Construir dashboard de métricas', tag: 'Frontend', priority: 'Alta', assignee: 'JP', estimate: '8 pts', date: '21 JUN', description: 'Conectar las métricas de sprint con una vista rápida y accionable.' },
    api: { id: 'api', title: 'Mapear endpoints de integraciones', tag: 'Backend', priority: 'Baja', assignee: 'AR', estimate: '3 pts', date: '24 JUN', description: 'Dejar lista la capa de servicios para el futuro backend en Python.' },
    auth: { id: 'auth', title: 'Estados de autenticación', tag: 'Frontend', priority: 'Media', assignee: 'LC', estimate: '5 pts', date: '19 JUN', description: 'Validar los estados de carga, error y sesión expirada.' },
    release: { id: 'release', title: 'Preparar release notes', tag: 'Operaciones', priority: 'Media', assignee: 'MS', estimate: '2 pts', date: '14 JUN', description: 'Resumen de los cambios incluidos en el release actual.' },
  },
}

const people = [
  { initials: 'LC', name: 'Laura C.', color: 'bg-[#d7c2fa]' },
  { initials: 'JP', name: 'José P.', color: 'bg-[#b9e3d2]' },
  { initials: 'MS', name: 'María S.', color: 'bg-[#f5c4af]' },
  { initials: 'AR', name: 'Andrés R.', color: 'bg-[#bfd5ed]' },
]

function Avatar({ initials, className = '' }) {
  const person = people.find((item) => item.initials === initials)
  return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper text-[10px] font-bold text-carbon ${person?.color || 'bg-voltage'} ${className}`}>{initials}</span>
}

function App() {
  const [state, setState] = useState(initialState)
  const [view, setView] = useState('board')
  const [selectedTask, setSelectedTask] = useState(null)
  const [dragged, setDragged] = useState(null)
  const [showToast, setShowToast] = useState(false)

  const totalTasks = useMemo(() => Object.keys(state.tasks).length, [state.tasks])
  const moveTask = (taskId, columnId) => {
    setState((current) => {
      const nextColumns = Object.fromEntries(Object.entries(current.columns).map(([id, column]) => [id, { ...column, taskIds: [...column.taskIds] }]))
      Object.values(nextColumns).forEach((column) => { column.taskIds = column.taskIds.filter((id) => id !== taskId) })
      nextColumns[columnId] = { ...nextColumns[columnId], taskIds: [...nextColumns[columnId].taskIds, taskId] }
      return { ...current, columns: nextColumns }
    })
  }
  const addTask = (columnId) => {
    const id = `task-${Date.now()}`
    setState((current) => ({
      columns: { ...current.columns, [columnId]: { ...current.columns[columnId], taskIds: [...current.columns[columnId].taskIds, id] } },
      tasks: { ...current.tasks, [id]: { id, title: 'Nueva tarea conectada', tag: 'Producto', priority: 'Media', assignee: 'LC', estimate: '3 pts', date: '25 JUN', description: 'Añade el contexto de esta nueva tarea.' } },
    }))
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 2200)
  }

  return (
    <div className="min-h-screen bg-paper text-carbon">
      <Sidebar view={view} setView={setView} />
      <main className="ml-[248px] min-h-screen">
        <header className="flex h-[84px] items-center justify-between border-b border-ground px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-voltage"><Zap size={19} fill="currentColor" /></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-carbon/45">Workspace</p><h1 className="font-display text-lg font-semibold">Product voltage</h1></div>
            <ChevronDown size={16} className="ml-1 text-carbon/40" />
          </div>
          <div className="flex items-center gap-5">
            <button className="relative rounded-lg p-2 text-carbon/55 transition hover:bg-white hover:text-carbon"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-voltage" /></button>
            <div className="h-7 w-px bg-ground" />
            <div className="flex items-center gap-2"><Avatar initials="LC" /><span className="text-sm font-semibold">Laura C.</span><ChevronDown size={14} className="text-carbon/40" /></div>
          </div>
        </header>
        <div className="px-10 pb-12 pt-9">
          <div className="mb-8 flex items-end justify-between">
            <div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-carbon/45"><span>Proyectos</span><span>/</span><span className="text-carbon">Atlas mobile</span></div><h2 className="font-display text-[32px] font-semibold tracking-[-0.04em]">Sprint 24 · Energía en movimiento</h2><p className="mt-2 text-sm text-carbon/55">Construye, conecta y entrega sin perder la carga.</p></div>
            <div className="flex items-center gap-3"><button className="button-secondary"><Users size={15} /> Compartir</button><button className="button-primary" onClick={() => addTask('backlog')}><Plus size={16} /> Nueva tarea</button></div>
          </div>
          <SprintProgress totalTasks={totalTasks} />
          {view === 'board' ? <Board state={state} setView={setView} setSelectedTask={setSelectedTask} dragged={dragged} setDragged={setDragged} moveTask={moveTask} addTask={addTask} /> : <Gantt state={state} />}
        </div>
      </main>
      {selectedTask && <TaskModal task={state.tasks[selectedTask]} close={() => setSelectedTask(null)} />}
      {showToast && <div className="fixed bottom-7 right-8 flex items-center gap-2 rounded-xl bg-carbon px-4 py-3 text-sm font-medium text-white shadow-xl"><Check size={16} className="text-voltage" /> Tarea conectada al backlog</div>}
    </div>
  )
}

function Sidebar({ view, setView }) {
  const nav = [{ id: 'board', label: 'Tablero', icon: LayoutDashboard }, { id: 'gantt', label: 'Plan temporal', icon: CalendarDays }]
  return <aside className="fixed inset-y-0 left-0 z-10 flex w-[248px] flex-col border-r border-ground bg-[#f1f0eb] px-5 py-7">
    <div className="mb-12 flex items-center gap-2.5 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-carbon text-voltage"><Zap size={16} fill="currentColor" /></div><span className="font-display text-xl font-bold tracking-[-0.04em]">voltage<span className="text-voltage">.</span></span></div>
    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-carbon/40">Workspace</p>
    <nav className="space-y-1">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`side-link ${view === id ? 'active' : ''}`}><Icon size={17} />{label}{id === 'board' && <span className="ml-auto rounded-md bg-carbon/10 px-1.5 py-0.5 text-[10px] font-bold">24</span>}</button>)}</nav>
    <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-carbon/40">Conecta</p>
    <nav className="space-y-1"><button className="side-link"><PlugZap size={17} />Integraciones</button><button className="side-link"><Command size={17} />API & webhooks</button></nav>
    <div className="mt-auto rounded-2xl border border-ground bg-paper p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">Carga del sprint</span><Activity size={15} className="text-carbon/40" /></div><div className="mb-2 h-2 overflow-hidden rounded-full bg-ground"><div className="h-full w-[72%] rounded-full bg-voltage" /></div><div className="flex justify-between text-[11px] text-carbon/50"><span>72% conectado</span><span>18 / 25 pts</span></div></div>
    <div className="mt-5 flex items-center gap-3 border-t border-ground px-2 pt-5 text-carbon/45"><Settings2 size={16} /><span className="text-xs font-semibold">Configuración</span><CircleHelp size={16} className="ml-auto" /></div>
  </aside>
}

function SprintProgress({ totalTasks }) {
  return <div className="mb-7 grid grid-cols-[1fr_auto] items-center rounded-2xl border border-ground bg-white/55 px-5 py-4"><div className="flex items-center gap-4"><div className="flex -space-x-2">{people.map((person) => <Avatar key={person.initials} initials={person.initials} />)}</div><div className="h-7 w-px bg-ground" /><span className="text-xs font-medium text-carbon/60"><strong className="text-carbon">{totalTasks} tareas</strong> en este sprint</span><span className="rounded-full bg-[#e1f1e7] px-2.5 py-1 text-[10px] font-bold text-[#438363]">En curso</span></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-carbon/40">Días restantes</p><p className="font-display text-lg font-semibold">08 <span className="text-xs font-normal text-carbon/45">de 14</span></p></div><div className="h-8 w-px bg-ground" /><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-carbon/40">Objetivo</p><p className="font-display text-lg font-semibold">82%</p></div></div></div>
}

function Board({ state, setView, setSelectedTask, dragged, setDragged, moveTask, addTask }) {
  return <><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><button className="filter-button active"><LayoutDashboard size={14} /> Kanban</button><button className="filter-button" onClick={() => setView('gantt')}><CalendarDays size={14} /> Gantt</button></div><div className="flex items-center gap-2 text-xs text-carbon/50"><button className="icon-button"><Search size={16} /></button><button className="icon-button"><Filter size={16} /></button><span className="ml-2">Actualizado hace 2 min</span></div></div><div className="grid grid-cols-4 gap-4">{Object.values(state.columns).map((column) => <Column key={column.id} column={column} tasks={state.tasks} dragged={dragged} setDragged={setDragged} moveTask={moveTask} setSelectedTask={setSelectedTask} addTask={addTask} />)}</div></>
}

function Column({ column, tasks, dragged, setDragged, moveTask, setSelectedTask, addTask }) {
  return <section className={`kanban-column ${dragged ? 'drag-active' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged) moveTask(dragged, column.id); setDragged(null) }}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} /><h3 className="text-sm font-bold">{column.title}</h3><span className="rounded-md bg-carbon/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-carbon/45">{column.taskIds.length}</span></div><button className="text-carbon/35 transition hover:text-carbon"><MoreHorizontal size={17} /></button></div><div className="space-y-3">{column.taskIds.map((id) => <TaskCard key={id} task={tasks[id]} setSelectedTask={setSelectedTask} setDragged={setDragged} />)}</div><button onClick={() => addTask(column.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ground py-3 text-xs font-semibold text-carbon/40 transition hover:border-carbon/30 hover:bg-white hover:text-carbon"><Plus size={14} /> Añadir tarea</button></section>
}

function TaskCard({ task, setSelectedTask, setDragged }) {
  return <article draggable onDragStart={() => setDragged(task.id)} onDragEnd={() => setDragged(null)} onClick={() => setSelectedTask(task.id)} className="task-card group cursor-grab active:cursor-grabbing"><div className="mb-3 flex items-start justify-between gap-3"><span className={`tag ${task.tag === 'Frontend' ? 'tag-yellow' : task.tag === 'Backend' ? 'tag-blue' : ''}`}>{task.tag}</span><GripVertical size={15} className="text-carbon/20 opacity-0 transition group-hover:opacity-100" /></div><h4 className="mb-4 text-[13px] font-semibold leading-5">{task.title}</h4><div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-carbon/40"><Clock3 size={13} /> {task.estimate}<span className="text-ground">•</span><span className={task.priority === 'Alta' ? 'text-[#d48b43]' : ''}>{task.priority}</span></div><div className="flex items-center justify-between border-t border-ground/70 pt-3"><div className="flex items-center gap-2"><Avatar initials={task.assignee} className="h-6 w-6 text-[9px]" /><span className="text-[10px] font-bold text-carbon/45">{task.date}</span></div><div className="flex items-center gap-2 text-carbon/30"><MessageCircle size={14} /><Paperclip size={13} /></div></div></article>
}

function Gantt({ state }) {
  const allTasks = Object.values(state.tasks)
  return <div className="rounded-2xl border border-ground bg-white/65 p-5"><div className="mb-7 flex items-center justify-between"><div><h3 className="font-display text-xl font-semibold">Mapa de entrega</h3><p className="mt-1 text-xs text-carbon/50">Planificación del sprint · 17 — 28 junio 2025</p></div><button className="button-secondary"><ListFilter size={15} /> Filtrar hitos</button></div><div className="gantt-grid"><div className="gantt-labels"><div className="h-10" />{allTasks.map((task) => <div key={task.id} className="flex h-14 items-center gap-2 border-t border-ground/60 pr-4 text-xs font-semibold"><span className="truncate">{task.title}</span></div>)}</div><div className="gantt-chart"><div className="gantt-days">{['17 JUN', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'].map((day, index) => <span key={day} className={index === 0 ? 'text-carbon' : ''}>{day}</span>)}</div>{allTasks.map((task, index) => <div key={task.id} className="relative h-14 border-t border-ground/60"><div className={`gantt-bar ${index % 3 === 0 ? 'w-[42%] bg-voltage' : index % 3 === 1 ? 'left-[17%] w-[46%] bg-[#cbe5d8]' : 'left-[33%] w-[31%] bg-[#cad8ea]'}`}><span>{task.estimate}</span></div></div>)}</div></div></div>
}

function TaskModal({ task, close }) {
  const [isSaving, setIsSaving] = useState(false)
  const saveTask = async () => {
    setIsSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    setIsSaving(false)
    close()
  }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-carbon/30 p-6 backdrop-blur-sm" onClick={close}><div className="w-full max-w-[620px] rounded-2xl border border-ground bg-paper p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-start justify-between"><div><span className="tag tag-yellow">{task.tag}</span><h2 className="mt-3 font-display text-2xl font-semibold">{task.title}</h2></div><button onClick={close} className="icon-button"><X size={17} /></button></div><div className="mb-5 flex items-center gap-5 border-y border-ground py-4 text-xs text-carbon/55"><span className="flex items-center gap-2"><Avatar initials={task.assignee} className="h-6 w-6 text-[9px]" /> Asignado</span><span className="flex items-center gap-2"><Target size={14} /> {task.estimate}</span><span className="flex items-center gap-2"><CalendarDays size={14} /> {task.date}</span></div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-carbon/45">Descripción enriquecida</label><div className="rounded-xl border border-ground bg-white p-4"><div className="mb-4 flex items-center gap-4 border-b border-ground pb-3 text-xs font-bold text-carbon/55"><b>B</b><i>I</i><span className="text-lg leading-none">↗</span><span className="h-4 w-px bg-ground" /><Paperclip size={14} /><span className="text-voltage">@</span></div><p className="text-sm leading-6 text-carbon/75">{task.description}</p><p className="mt-4 text-xs text-carbon/40">Menciona a un colaborador con @ para solicitar una revisión.</p></div><div className="mt-6 flex justify-end gap-3"><button className="button-secondary" onClick={close} disabled={isSaving}>Cancelar</button><button className="button-primary" onClick={saveTask} disabled={isSaving}>{isSaving ? <><Activity size={14} className="animate-spin" /> Guardando...</> : <><Pencil size={14} /> Guardar cambios</>}</button></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)

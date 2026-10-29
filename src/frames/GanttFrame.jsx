import { ListFilter } from 'lucide-react'
import { useState } from 'react'
import { Button, FrameHeader } from '../components/Shared.jsx'

export default function GanttFrame({ state, notify }) {
  const tasks = Object.values(state.tasks)
  const [filter, setFilter] = useState('Todas')
  const visibleTasks = filter === 'Todas' ? tasks : tasks.filter((task) => task.tag === filter)
  return <div className="rounded-2xl border border-ground bg-white/65 p-5"><FrameHeader eyebrow="Roadmap" title="Mapa de entrega" description="Planificación del sprint · 17 — 28 junio 2025" action={<select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-ground bg-white px-3 py-2 text-xs font-bold"><option>Todas</option><option>Frontend</option><option>Backend</option><option>Producto</option></select>}><Button variant="secondary" onClick={() => notify('Gantt actualizado')}><ListFilter size={15} /> Actualizar hitos</Button></FrameHeader><div className="gantt-grid"><div className="gantt-labels"><div className="h-10" />{visibleTasks.map((task) => <div key={task.id} className="flex h-14 items-center border-t border-ground/60 pr-4 text-xs font-semibold"><span className="truncate">{task.title}</span></div>)}</div><div className="gantt-chart"><div className="gantt-days">{['17 JUN', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'].map((day, index) => <span key={day} className={index === 0 ? 'text-carbon' : ''}>{day}</span>)}</div>{visibleTasks.map((task, index) => <div key={task.id} className="relative h-14 border-t border-ground/60"><button onClick={() => notify(`Hito seleccionado: ${task.title}`)} className={`gantt-bar text-left transition hover:brightness-95 ${index % 3 === 0 ? 'w-[42%] bg-voltage' : index % 3 === 1 ? 'left-[17%] w-[46%] bg-[#cbe5d8]' : 'left-[33%] w-[31%] bg-[#cad8ea]'}`}><span>{task.estimate}</span></button></div>)}</div></div></div>
}

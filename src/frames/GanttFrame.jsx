import { ListFilter } from 'lucide-react'
import { Button, FrameHeader } from '../components/Shared.jsx'

export default function GanttFrame({ state }) {
  const tasks = Object.values(state.tasks)
  return <div className="rounded-2xl border border-ground bg-white/65 p-5"><FrameHeader eyebrow="Roadmap" title="Mapa de entrega" description="Planificación del sprint · 17 — 28 junio 2025" action={<Button variant="secondary"><ListFilter size={15} /> Filtrar hitos</Button>} /><div className="gantt-grid"><div className="gantt-labels"><div className="h-10" />{tasks.map((task) => <div key={task.id} className="flex h-14 items-center border-t border-ground/60 pr-4 text-xs font-semibold"><span className="truncate">{task.title}</span></div>)}</div><div className="gantt-chart"><div className="gantt-days">{['17 JUN', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'].map((day, index) => <span key={day} className={index === 0 ? 'text-carbon' : ''}>{day}</span>)}</div>{tasks.map((task, index) => <div key={task.id} className="relative h-14 border-t border-ground/60"><div className={`gantt-bar ${index % 3 === 0 ? 'w-[42%] bg-voltage' : index % 3 === 1 ? 'left-[17%] w-[46%] bg-[#cbe5d8]' : 'left-[33%] w-[31%] bg-[#cad8ea]'}`}><span>{task.estimate}</span></div></div>)}</div></div></div>
}

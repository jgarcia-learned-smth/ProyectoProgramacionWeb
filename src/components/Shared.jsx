import React from 'react'
import { people } from '../app-data.jsx'

export const Avatar = React.memo(function Avatar({ initials, className = '' }) {
  const person = people.find((item) => item.initials === initials)
  return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper text-[10px] font-bold text-carbon ${person?.color || 'bg-voltage'} ${className}`}>{initials}</span>
})

export function Button({ children, variant = 'primary', ...props }) {
  return <button className={variant === 'primary' ? 'button-primary' : 'button-secondary'} {...props}>{children}</button>
}

export function IconButton({ children, ...props }) {
  return <button className="icon-button" {...props}>{children}</button>
}

export function SprintProgress({ totalTasks }) {
  return <div className="mb-7 grid grid-cols-[1fr_auto] items-center rounded-2xl border border-ground bg-white/55 px-5 py-4"><div className="flex items-center gap-4"><div className="flex -space-x-2">{people.map((person) => <Avatar key={person.initials} initials={person.initials} />)}</div><div className="h-7 w-px bg-ground" /><span className="text-xs font-medium text-carbon/60"><strong className="text-carbon">{totalTasks} tareas</strong> en este sprint</span><span className="rounded-full bg-[#e1f1e7] px-2.5 py-1 text-[10px] font-bold text-[#438363]">En curso</span></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-carbon/40">Días restantes</p><p className="font-display text-lg font-semibold">08 <span className="text-xs font-normal text-carbon/45">de 14</span></p></div><div className="h-8 w-px bg-ground" /><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-carbon/40">Objetivo</p><p className="font-display text-lg font-semibold">82%</p></div></div></div>
}

export function FrameHeader({ eyebrow, title, description, action, children }) {
  return <div className="mb-5 flex items-center justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-carbon/40">{eyebrow}</p><h3 className="font-display text-xl font-semibold">{title}</h3><p className="mt-1 text-xs text-carbon/50">{description}</p></div><div className="flex items-center gap-2">{children}{action}</div></div>
}

export function EmptyState({ title, description, action }) {
  return <div className="empty-state"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-voltage"><span className="text-xl">∿</span></div><h3 className="font-display text-lg font-semibold">{title}</h3><p className="mt-2 max-w-sm text-xs leading-5 text-carbon/50">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}

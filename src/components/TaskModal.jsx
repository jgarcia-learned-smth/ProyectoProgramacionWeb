import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { Avatar, Button, IconButton } from './Shared.jsx'

export default function TaskModal({ task, close }) {
  const { updateTask, addTaskComment, assignTaskRole, notify } = useWorkspace()
  const [saving, setSaving] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)
  const [description, setDescription] = useState(task.description || '')
  const [comment, setComment] = useState('')
  const [assignee, setAssignee] = useState(task.assignee)
  const [attachment, setAttachment] = useState('')

  const save = async () => {
    setSaving(true)
    try {
      await updateTask({ ...task, description, assignee, attachment })
      close()
      notify('Tarea guardada en el workspace')
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const addComment = async () => {
    const text = comment.trim()
    if (!text) return
    setCommentSaving(true)
    try {
      await addTaskComment(task.id, { author: 'LC', text })
      setComment('')
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setCommentSaving(false)
    }
  }

  const assign = async (value) => {
    const previousAssignee = assignee
    setAssignee(value)
    try {
      await assignTaskRole(task.id, value)
    } catch (requestError) {
      setAssignee(previousAssignee)
      notify(requestError.message)
    }
  }

  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-carbon/30 p-6 backdrop-blur-sm" onClick={close}><div className="w-full max-w-[660px] rounded-2xl border border-ground bg-paper p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-start justify-between"><div><span className="tag tag-yellow">{task.tag}</span><h2 className="mt-3 font-display text-2xl font-semibold">{task.title}</h2></div><IconButton aria-label="Cerrar tarea" onClick={close}><X size={17} /></IconButton></div><div className="mb-5 flex items-center gap-5 border-y border-ground py-4 text-xs text-carbon/55"><label className="flex items-center gap-2">Asignado<select value={assignee} onChange={(event) => assign(event.target.value)} className="rounded-lg border border-ground bg-white px-2 py-1 text-xs font-bold text-carbon"><option value="LC">Laura C.</option><option value="JP">José P.</option><option value="MS">María S.</option><option value="AR">Andrés R.</option></select></label><span>{task.estimate}</span><span>{task.date}</span></div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-carbon/45">Descripción enriquecida</label><div className="rounded-xl border border-ground bg-white p-4"><div className="mb-3 flex items-center gap-4 border-b border-ground pb-3 text-xs font-bold text-carbon/55"><button type="button" onClick={() => setDescription((value) => `**${value}**`)}>B</button><button type="button" onClick={() => setDescription((value) => `_${value}_`)}><i>I</i></button><button type="button" onClick={() => setDescription((value) => `${value} @JP`)} className="text-voltage">@ mención</button><label className="cursor-pointer">Adjuntar<input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0]?.name || '')} /></label></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full resize-y bg-transparent text-sm leading-6 text-carbon/75 outline-none" />{attachment && <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs text-carbon/55">Adjunto: {attachment}</p>}</div><div className="mt-5 border-t border-ground pt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-carbon/45">Colaboración y comentarios</p><div className="mb-3 space-y-2">{(task.comments || []).map((item) => <div key={item.id} className="flex gap-2 rounded-lg bg-white p-2 text-xs"><Avatar initials={item.author} className="h-6 w-6 text-[9px]" /><span>{item.text}</span></div>)}</div><div className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addComment() }} placeholder="Escribe una actualización..." className="min-w-0 flex-1 rounded-lg border border-ground bg-white px-3 py-2 text-xs outline-none focus:border-voltage" /><Button variant="secondary" onClick={addComment} disabled={commentSaving}>{commentSaving ? 'Enviando...' : 'Comentar'}</Button></div></div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={close} disabled={saving || commentSaving}>Cancelar</Button><Button onClick={save} disabled={saving || commentSaving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button></div></div></div>
}

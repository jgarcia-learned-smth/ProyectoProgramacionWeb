import { Bell, Globe2, Save, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, EmptyState, FrameHeader } from '../components/Shared.jsx'
import { getPreferences, updatePreferences } from '../services/accountService.js'

const defaultPreferences = { locale: 'es', notifications: true, timezone: 'America/Caracas' }

export default function SettingsFrame() {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadPreferences = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getPreferences()
      setPreferences({ ...defaultPreferences, ...(result.preferences || result) })
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar las preferencias.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  const save = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      await updatePreferences(preferences)
      setSuccess('Preferencias guardadas correctamente.')
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron guardar las preferencias.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <EmptyState title="Cargando configuración" description="Consultando tus preferencias en el backend." />
  if (error && !preferences.locale) return <EmptyState title="No se pudo cargar la configuración" description={error} action={<Button onClick={loadPreferences}>Reintentar</Button>} />

  return <form onSubmit={save}><FrameHeader eyebrow="Workspace" title="Configuración" description="Ajusta tu espacio de trabajo y conserva el flujo de energía." action={<Button type="submit" disabled={isSaving}><Save size={14} /> {isSaving ? 'Guardando...' : 'Guardar cambios'}</Button>} /><div className="grid grid-cols-[1.2fr_1fr] gap-5"><section className="space-y-4 rounded-2xl border border-ground bg-white/65 p-6"><label className="block text-sm font-semibold"><span className="mb-2 flex items-center gap-2 text-carbon/60"><Globe2 size={16} /> Idioma</span><select value={preferences.locale} onChange={(event) => setPreferences((current) => ({ ...current, locale: event.target.value }))} className="w-full rounded-lg border border-ground bg-white px-3 py-2 text-sm"><option value="es">Español</option><option value="en">English</option></select></label><label className="block text-sm font-semibold"><span className="mb-2 block text-carbon/60">Zona horaria</span><select value={preferences.timezone} onChange={(event) => setPreferences((current) => ({ ...current, timezone: event.target.value }))} className="w-full rounded-lg border border-ground bg-white px-3 py-2 text-sm"><option value="America/Caracas">Caracas (GMT-4)</option><option value="America/New_York">Nueva York (GMT-5)</option><option value="Europe/Madrid">Madrid (GMT+1)</option></select></label><label className="flex items-center justify-between rounded-xl border border-ground bg-paper p-4 text-sm font-semibold"><span className="flex items-center gap-2"><Bell size={16} /> Recibir notificaciones</span><input type="checkbox" checked={preferences.notifications} onChange={(event) => setPreferences((current) => ({ ...current, notifications: event.target.checked }))} className="h-4 w-4 accent-voltage" /></label>{(error || success) && <p className={`rounded-lg px-3 py-2 text-xs ${error ? 'bg-red-50 text-red-700' : 'bg-[#e1f1e7] text-[#438363]'}`}>{error || success}</p>}</section><section className="rounded-2xl border border-ground bg-carbon p-6 text-white"><div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-voltage text-carbon"><Zap size={19} /></div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Estado del workspace</p><h4 className="mt-2 font-display text-2xl font-semibold">Todo conectado.</h4><p className="mt-3 text-sm leading-6 text-white/55">Las preferencias se sincronizan con el backend de colaboración.</p></section></div></form>
}

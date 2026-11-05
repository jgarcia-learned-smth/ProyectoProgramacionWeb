import { Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Avatar, Button, EmptyState, FrameHeader } from '../components/Shared.jsx'
import { changePassword, getProfile, updateProfile } from '../services/accountService.js'

const emptyProfile = { name: '', email: '', role: 'Miembro' }

export default function ProfileFrame() {
  const [profile, setProfile] = useState(emptyProfile)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getProfile()
      setProfile({ ...emptyProfile, ...(result.profile || result) })
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar el perfil.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!profile.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setError('Introduce un nombre y un correo electrónico válidos.')
      return
    }
    const changingPassword = passwords.currentPassword || passwords.newPassword || passwords.confirmPassword
    if (changingPassword && (passwords.newPassword.length < 8 || passwords.newPassword !== passwords.confirmPassword)) {
      setError('La nueva contraseña debe tener al menos 8 caracteres y coincidir con su confirmación.')
      return
    }
    setIsSaving(true)
    try {
      await updateProfile({ name: profile.name.trim(), email: profile.email.trim() })
      if (changingPassword) await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccess('Perfil actualizado correctamente.')
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <EmptyState title="Cargando perfil" description="Consultando tu identidad en el backend." />
  if (error && !profile.name) return <EmptyState title="No se pudo cargar el perfil" description={error} action={<Button onClick={loadProfile}>Reintentar</Button>} />

  return <form onSubmit={submit} className="rounded-2xl border border-ground bg-white/65 p-6"><FrameHeader eyebrow="Cuenta" title="Mi perfil" description="Administra tu identidad y tus permisos en el workspace." action={<Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar perfil'}</Button>} /><div className="grid grid-cols-[auto_1fr] items-center gap-6 border-b border-ground pb-6"><Avatar initials={profile.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'} className="h-20 w-20 text-xl" /><div><h3 className="font-display text-2xl font-semibold">{profile.name}</h3><p className="mt-1 text-sm text-carbon/55">{profile.role}</p><span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e1f1e7] px-2.5 py-1 text-[10px] font-bold text-[#438363]"><ShieldCheck size={12} /> Acceso verificado</span></div></div><div className="mt-6 grid grid-cols-2 gap-4"><label className="block text-xs font-bold"><span className="mb-2 flex items-center gap-2 text-carbon/55"><UserRound size={14} /> Nombre visible</span><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-lg border border-ground bg-white px-3 py-2 text-sm font-medium outline-none focus:border-voltage" /></label><label className="block text-xs font-bold"><span className="mb-2 flex items-center gap-2 text-carbon/55"><Mail size={14} /> Correo electrónico</span><input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-lg border border-ground bg-white px-3 py-2 text-sm font-medium outline-none focus:border-voltage" /></label></div><div className="mt-6 border-t border-ground pt-5"><h4 className="font-display text-lg font-semibold">Cambiar contraseña</h4><div className="mt-4 grid grid-cols-3 gap-4">{[['currentPassword', 'Contraseña actual'], ['newPassword', 'Nueva contraseña'], ['confirmPassword', 'Confirmar contraseña']].map(([key, label]) => <label key={key} className="block text-xs font-bold"><span className="mb-2 block text-carbon/55">{label}</span><input type="password" value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-ground bg-white px-3 py-2 text-sm outline-none focus:border-voltage" /></label>)}</div></div>{(error || success) && <p className={`mt-5 rounded-lg px-3 py-2 text-xs ${error ? 'bg-red-50 text-red-700' : 'bg-[#e1f1e7] text-[#438363]'}`}>{error || success}</p>}</form>
}

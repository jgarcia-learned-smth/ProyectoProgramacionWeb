import { Bell, Check, Globe2, LockKeyhole, Palette, Save, UserRound, Zap } from 'lucide-react'
import { Button, FrameHeader } from '../components/Shared.jsx'

const settings = [
  { title: 'Perfil del workspace', detail: 'Atlas mobile · Equipo de producto', icon: UserRound },
  { title: 'Preferencias de notificación', detail: 'Actividad, entregas y menciones', icon: Bell },
  { title: 'Permisos y roles', detail: '4 miembros con acceso', icon: LockKeyhole },
  { title: 'Idioma y zona horaria', detail: 'Español · Caracas (GMT-4)', icon: Globe2 },
  { title: 'Apariencia', detail: 'Tema claro · Accent voltage', icon: Palette },
]

export default function SettingsFrame({ notify }) {
  return <div><FrameHeader eyebrow="Workspace" title="Configuración" description="Ajusta tu espacio de trabajo y conserva el flujo de energía." action={<Button onClick={() => notify('Preferencias guardadas')}><Save size={14} /> Guardar cambios</Button>} /><div className="grid grid-cols-[1.2fr_1fr] gap-5"><section className="rounded-2xl border border-ground bg-white/65 p-3">{settings.map(({ title, detail, icon: Icon }, index) => <button key={title} onClick={() => notify(`${title} seleccionado`)} className={`settings-row ${index === 0 ? 'selected' : ''}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper"><Icon size={17} /></span><span className="text-left"><strong className="block text-sm">{title}</strong><small className="mt-1 block text-xs text-carbon/50">{detail}</small></span>{index === 0 && <Check size={16} className="ml-auto text-[#438363]" />}</button>)}</section><section className="rounded-2xl border border-ground bg-carbon p-6 text-white"><div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-voltage text-carbon"><Zap size={19} /></div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Estado del workspace</p><h4 className="mt-2 font-display text-2xl font-semibold">Todo conectado.</h4><p className="mt-3 text-sm leading-6 text-white/55">La configuración se guarda localmente mientras el backend de colaboración está en preparación.</p><div className="mt-8 border-t border-white/15 pt-4 text-xs text-white/55"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-voltage" /> Modo mock activo</span></div></section></div></div>
}

import { Check, PlugZap, RefreshCw, Slack, Trello, Zap } from 'lucide-react'
import { Button, FrameHeader } from '../components/Shared.jsx'

const integrations = [
  { name: 'Slack', detail: 'Notificaciones de actividad y entregas', icon: Slack, color: 'bg-[#eee4f8]', connected: true },
  { name: 'Trello', detail: 'Importa tableros existentes', icon: Trello, color: 'bg-[#dce9f5]', connected: false },
]

export default function IntegrationsFrame({ notify }) {
  return <div><FrameHeader eyebrow="Conexiones de red" title="Integraciones" description="Conecta tus herramientas para que el trabajo mantenga la carga." action={<Button onClick={() => notify('Catálogo actualizado')}><RefreshCw size={14} /> Actualizar catálogo</Button>} /><div className="grid grid-cols-3 gap-4">{integrations.map(({ name, detail, icon: Icon, color, connected }) => <article key={name} className="integration-card"><div className={`integration-icon ${color}`}><Icon size={24} /></div><div className="mt-5 flex items-start justify-between"><div><h4 className="font-display text-lg font-semibold">{name}</h4><p className="mt-1 text-xs leading-5 text-carbon/50">{detail}</p></div>{connected && <span className="flex items-center gap-1 text-[10px] font-bold text-[#438363]"><Check size={13} /> Conectado</span>}</div><Button variant={connected ? 'secondary' : 'primary'} onClick={() => notify(`${name}: conexión simulada`)}>{connected ? 'Configurar' : 'Conectar'} <PlugZap size={14} /></Button></article>)}</div><div className="mt-5 rounded-2xl border border-dashed border-ground bg-white/40 p-8 text-center"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-voltage"><Zap size={18} /></div><p className="text-sm font-semibold">¿No encuentras tu integración?</p><p className="mt-1 text-xs text-carbon/50">Conecta nuevas tareas para generar carga con una conexión personalizada.</p></div></div>
}

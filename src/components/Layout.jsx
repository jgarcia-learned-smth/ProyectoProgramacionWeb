import React from 'react'
import { Activity, Bell, CalendarDays, ChevronDown, CircleHelp, LayoutDashboard, PlugZap, Settings2, Users, Zap } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Button, IconButton, SprintProgress } from './Shared.jsx'

const navigation = [
  { path: '/board', label: 'Tablero', icon: LayoutDashboard, count: '24' },
  { path: '/gantt', label: 'Plan temporal', icon: CalendarDays },
  { path: '/integrations', label: 'Integraciones', icon: PlugZap },
  { path: '/settings', label: 'Configuración', icon: Settings2 },
]

const pageTitles = {
  '/board': 'Sprint 24 · Energía en movimiento',
  '/gantt': 'Plan temporal',
  '/integrations': 'Integraciones',
  '/settings': 'Configuración',
  '/profile': 'Mi perfil',
}

export default function Layout({ children, totalTasks, notify, addTask }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || pageTitles['/board']

  return (
    <div className="min-h-screen bg-paper text-carbon">
      <Sidebar />
      <main className="ml-[248px] min-h-screen">
        <Header notify={notify} />
        <div className="px-10 pb-12 pt-9">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-carbon/45"><span>Proyectos</span><span>/</span><span className="text-carbon">Atlas mobile</span></div>
              <h2 className="font-display text-[32px] font-semibold tracking-[-0.04em]">{title}</h2>
              <p className="mt-2 text-sm text-carbon/55">Construye, conecta y entrega sin perder la carga.</p>
            </div>
            <div className="flex items-center gap-3"><Button variant="secondary" onClick={() => notify('Enlace de colaboración copiado')}><Users size={15} /> Compartir</Button><Button onClick={() => addTask('backlog')}><Zap size={15} /> Nueva tarea</Button></div>
          </div>
          <SprintProgress totalTasks={totalTasks} />
          {children}
        </div>
      </main>
    </div>
  )
}

function Header({ notify }) {
  const [state, setState] = useDropdownState()
  const toggle = (key) => setState((current) => ({ workspace: false, notifications: false, user: false, [key]: !current[key] }))

  return (
    <header className="flex h-[84px] items-center justify-between border-b border-ground px-10">
      <div className="relative">
        <button className="flex items-center gap-4 rounded-xl px-2 py-1 text-left transition hover:bg-white" onClick={() => toggle('workspace')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-voltage"><Zap size={19} fill="currentColor" /></div>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-carbon/45">Workspace</p><h1 className="font-display text-lg font-semibold">Product voltage</h1></div>
          <ChevronDown size={16} className="text-carbon/40" />
        </button>
        {state.workspace && <Dropdown className="left-0 top-14 w-56"><p className="dropdown-label">Tus workspaces</p><button className="dropdown-item active" onClick={() => toggle('workspace')}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-voltage text-xs font-bold">P</span><span><strong>Product voltage</strong><small>Workspace actual</small></span></button><button className="dropdown-item" onClick={() => notify('Creación de workspace disponible próximamente')}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ground text-lg">+</span><span><strong>Nuevo workspace</strong><small>Conecta otro equipo</small></span></button></Dropdown>}
      </div>
      <div className="flex items-center gap-5">
        <div className="relative"><IconButton aria-label="Abrir notificaciones" onClick={() => toggle('notifications')}><Bell size={18} /><span className="notification-dot" /></IconButton>{state.notifications && <NotificationsPanel close={() => toggle('notifications')} notify={notify} />}</div>
        <div className="h-7 w-px bg-ground" />
        <div className="relative"><button className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white" onClick={() => toggle('user')}><Avatar initials="LC" /><span className="text-sm font-semibold">Laura C.</span><ChevronDown size={14} className="text-carbon/40" /></button>{state.user && <UserMenu close={() => toggle('user')} notify={notify} />}</div>
      </div>
    </header>
  )
}

function useDropdownState() {
  const [state, setState] = React.useState({ workspace: false, notifications: false, user: false })
  return [state, setState]
}

function Sidebar() {
  return <aside className="fixed inset-y-0 left-0 z-10 flex w-[248px] flex-col border-r border-ground bg-[#f1f0eb] px-5 py-7"><NavLink to="/board" className="mb-12 flex items-center gap-2.5 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-carbon text-voltage"><Zap size={16} fill="currentColor" /></div><span className="font-display text-xl font-bold tracking-[-0.04em]">voltage<span className="text-voltage">.</span></span></NavLink><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-carbon/40">Workspace</p><nav className="space-y-1">{navigation.map(({ path, label, icon: Icon, count }) => <NavLink key={path} to={path} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon size={17} />{label}{count && <span className="ml-auto rounded-md bg-carbon/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>}</NavLink>)}</nav><div className="mt-auto rounded-2xl border border-ground bg-paper p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">Carga del sprint</span><Activity size={15} className="text-carbon/40" /></div><div className="mb-2 h-2 overflow-hidden rounded-full bg-ground"><div className="h-full w-[72%] rounded-full bg-voltage" /></div><div className="flex justify-between text-[11px] text-carbon/50"><span>72% conectado</span><span>18 / 25 pts</span></div></div><NavLink to="/settings" className="mt-5 flex items-center gap-3 border-t border-ground px-2 pt-5 text-carbon/45"><Settings2 size={16} /><span className="text-xs font-semibold">Configuración</span><CircleHelp size={16} className="ml-auto" /></NavLink></aside>
}

function Dropdown({ children, className = '' }) {
  return <div className={`dropdown-panel ${className}`}>{children}</div>
}

function NotificationsPanel({ close, notify }) {
  return <Dropdown className="right-0 top-12 w-80"><div className="flex items-center justify-between border-b border-ground px-4 py-3"><strong className="text-sm">Notificaciones</strong><button className="text-[10px] font-bold text-carbon/45 hover:text-carbon" onClick={() => notify('Notificaciones marcadas como leídas')}>Marcar leídas</button></div><div className="space-y-1 p-2"><button className="notification-item" onClick={() => { notify('Revisión abierta'); close() }}><span className="notification-badge bg-[#d7c2fa]">LC</span><span><strong>Laura comentó en una tarea</strong><small>Hace 8 min · Tokens de diseño voltage</small></span><i /></button><button className="notification-item" onClick={() => { notify('Sprint actualizado'); close() }}><span className="notification-badge bg-[#b9e3d2]">JP</span><span><strong>José actualizó el sprint</strong><small>Hace 24 min · 3 puntos completados</small></span><i /></button></div><button className="w-full border-t border-ground px-4 py-3 text-center text-xs font-bold text-carbon/55 hover:bg-paper" onClick={() => { notify('Todas las notificaciones están visibles'); close() }}>Ver todas las notificaciones</button></Dropdown>
}

function UserMenu({ close, notify }) {
  const navigate = useNavigate()
  return <Dropdown className="right-0 top-12 w-56"><div className="border-b border-ground px-4 py-3"><p className="text-sm font-bold">Laura C.</p><p className="mt-1 text-xs text-carbon/50">Product lead</p></div><div className="p-2"><button className="dropdown-item" onClick={() => { navigate('/profile'); close() }}>Mi perfil</button><button className="dropdown-item" onClick={() => { navigate('/settings'); close() }}>Configuración</button><button className="dropdown-item" onClick={() => notify('Preferencias de ayuda abiertas')}>Ayuda y atajos</button></div><button className="w-full border-t border-ground px-4 py-3 text-left text-xs font-bold text-[#b05d46] hover:bg-[#fff1ed]" onClick={() => { notify('La sesión demo sigue activa'); close() }}>Cerrar sesión demo</button></Dropdown>
}

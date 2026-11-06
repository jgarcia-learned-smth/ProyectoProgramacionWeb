import React from 'react'
import { Activity, Bell, CalendarDays, ChevronDown, CircleHelp, LayoutDashboard, PlugZap, Settings2, Users, Zap } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Button, IconButton, SprintProgress } from './Shared.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/accountService.js'
import { logout } from '../services/authService.js'

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

export default function Layout({ children }) {
  const location = useLocation()
  const { state, profile, error, notify, loadWorkspace, addTask } = useWorkspace()
  const title = pageTitles[location.pathname] || pageTitles['/board']
  const totalTasks = Object.keys(state.tasks).length
  const handleAddTask = async () => {
    try {
      await addTask('backlog')
    } catch (requestError) {
      notify(requestError.message)
    }
  }

  return (
    <div className="min-h-screen bg-paper text-carbon">
      <Sidebar />
      <main className="ml-[248px] min-h-screen">
        <Header profile={profile} notify={notify} />
        <div className="px-10 pb-12 pt-9">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-carbon/45"><span>Proyectos</span><span>/</span><span className="text-carbon">Atlas mobile</span></div>
              <h2 className="font-display text-[32px] font-semibold tracking-[-0.04em]">{title}</h2>
              <p className="mt-2 text-sm text-carbon/55">Construye, conecta y entrega sin perder la carga.</p>
            </div>
            <div className="flex items-center gap-3"><Button variant="secondary" onClick={() => notify('Enlace de colaboración copiado')}><Users size={15} /> Compartir</Button><Button onClick={handleAddTask}><Zap size={15} /> Nueva tarea</Button></div>
          </div>
          <SprintProgress totalTasks={totalTasks} />
          {error && <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><span>{error.message || 'Se produjo un error inesperado.'}</span><Button variant="secondary" onClick={loadWorkspace}>Reintentar</Button></div>}
          {children}
        </div>
      </main>
    </div>
  )
}

function Header({ profile, notify }) {
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
        <div className="relative"><button className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white" onClick={() => toggle('user')}><Avatar initials={getInitials(profile?.name)} /><span className="text-sm font-semibold">{profile?.name || 'Cargando...'}</span><ChevronDown size={14} className="text-carbon/40" /></button>{state.user && <UserMenu profile={profile} close={() => toggle('user')} notify={notify} />}</div>
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
  const [notifications, setNotifications] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true
    getNotifications().then((result) => {
      if (active) setNotifications(result.notifications || [])
    }).catch((requestError) => {
      if (active) setError(requestError.message || 'No se pudieron cargar las notificaciones.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: new Date().toISOString() })))
      notify('Notificaciones marcadas como leídas')
    } catch (requestError) {
      notify(requestError.message || 'No se pudieron marcar las notificaciones.')
    }
  }

  const markRead = async (notification) => {
    try {
      if (!notification.readAt) await markNotificationRead(notification.id)
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
      close()
    } catch (requestError) {
      notify(requestError.message || 'No se pudo marcar la notificación.')
    }
  }

  return <Dropdown className="right-0 top-12 w-80"><div className="flex items-center justify-between border-b border-ground px-4 py-3"><strong className="text-sm">Notificaciones</strong><button className="text-[10px] font-bold text-carbon/45 hover:text-carbon" onClick={markAllRead}>Marcar leídas</button></div><div className="space-y-1 p-2">{loading ? <p className="px-2 py-4 text-xs text-carbon/50">Cargando notificaciones...</p> : error ? <p className="px-2 py-4 text-xs text-red-700">{error}</p> : notifications.length === 0 ? <p className="px-2 py-4 text-xs text-carbon/50">No hay notificaciones.</p> : notifications.map((notification) => <button key={notification.id} className={`notification-item ${notification.readAt ? 'opacity-60' : ''}`} onClick={() => markRead(notification)}><span className="notification-badge bg-[#d7c2fa]">!</span><span><strong>{notification.title}</strong><small>{notification.message}</small></span>{!notification.readAt && <i />}</button>)}</div><button className="w-full border-t border-ground px-4 py-3 text-center text-xs font-bold text-carbon/55 hover:bg-paper" onClick={markAllRead}>Marcar todas como leídas</button></Dropdown>
}

function UserMenu({ profile, close, notify }) {
  const navigate = useNavigate()
  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (requestError) {
      notify(requestError.message || 'No se pudo cerrar la sesión.')
    }
  }
  return <Dropdown className="right-0 top-12 w-56"><div className="border-b border-ground px-4 py-3"><p className="text-sm font-bold">{profile?.name || 'Usuario'}</p><p className="mt-1 text-xs text-carbon/50">{profile?.role || 'Miembro'}</p></div><div className="p-2"><button className="dropdown-item" onClick={() => { navigate('/profile'); close() }}>Mi perfil</button><button className="dropdown-item" onClick={() => { navigate('/settings'); close() }}>Configuración</button><button className="dropdown-item" onClick={() => { notify('La ayuda estará disponible próximamente'); close() }}>Ayuda y atajos</button></div><button className="w-full border-t border-ground px-4 py-3 text-left text-xs font-bold text-[#b05d46] hover:bg-[#fff1ed]" onClick={handleLogout}>Cerrar sesión</button></Dropdown>
}

function getInitials(name = '') {
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return initials || 'U'
}

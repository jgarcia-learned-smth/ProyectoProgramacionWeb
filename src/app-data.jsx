export const initialState = {
  columns: {
    backlog: { id: 'backlog', title: 'Backlog', color: '#B9B7AF', taskIds: ['voltage', 'research'] },
    progress: { id: 'progress', title: 'En progreso', color: '#FAD749', taskIds: ['dashboard', 'api'] },
    review: { id: 'review', title: 'En revisión', color: '#A7C8B8', taskIds: ['auth'] },
    done: { id: 'done', title: 'Listo', color: '#8D9BA8', taskIds: ['release'] },
  },
  tasks: {
    voltage: { id: 'voltage', title: 'Definir tokens de diseño voltage', tag: 'Diseño', priority: 'Alta', assignee: 'LC', estimate: '3 pts', date: '18 JUN', description: 'Crear la base visual del sistema: color spark, border ground y escalas tipográficas.' },
    research: { id: 'research', title: 'Auditar flujo de onboarding', tag: 'Producto', priority: 'Media', assignee: 'MS', estimate: '5 pts', date: '20 JUN', description: 'Revisar los puntos de fricción y documentar oportunidades de mejora.' },
    dashboard: { id: 'dashboard', title: 'Construir dashboard de métricas', tag: 'Frontend', priority: 'Alta', assignee: 'JP', estimate: '8 pts', date: '21 JUN', description: 'Conectar las métricas de sprint con una vista rápida y accionable.' },
    api: { id: 'api', title: 'Mapear endpoints de integraciones', tag: 'Backend', priority: 'Baja', assignee: 'AR', estimate: '3 pts', date: '24 JUN', description: 'Dejar lista la capa de servicios para el futuro backend en Python.' },
    auth: { id: 'auth', title: 'Estados de autenticación', tag: 'Frontend', priority: 'Media', assignee: 'LC', estimate: '5 pts', date: '19 JUN', description: 'Validar los estados de carga, error y sesión expirada.' },
    release: { id: 'release', title: 'Preparar release notes', tag: 'Operaciones', priority: 'Media', assignee: 'MS', estimate: '2 pts', date: '14 JUN', description: 'Resumen de los cambios incluidos en el release actual.' },
  },
}

export const people = [
  { initials: 'LC', name: 'Laura C.', color: 'bg-[#d7c2fa]' },
  { initials: 'JP', name: 'José P.', color: 'bg-[#b9e3d2]' },
  { initials: 'MS', name: 'María S.', color: 'bg-[#f5c4af]' },
  { initials: 'AR', name: 'Andrés R.', color: 'bg-[#bfd5ed]' },
]

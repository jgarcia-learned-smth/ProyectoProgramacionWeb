import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useWorkspace, WorkspaceProvider } from './context/WorkspaceContext.jsx'
import TaskModal from './components/TaskModal.jsx'
import BoardFrame from './frames/BoardFrame.jsx'
import GanttFrame from './frames/GanttFrame.jsx'
import IntegrationsFrame from './frames/IntegrationsFrame.jsx'
import SettingsFrame from './frames/SettingsFrame.jsx'
import ProfileFrame from './frames/ProfileFrame.jsx'
import './styles.css'

class AppErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-center"><div><h1 className="font-display text-2xl font-semibold">Algo salió mal</h1><p className="mt-2 text-sm text-carbon/55">La interfaz no pudo completar esta vista.</p><button className="button-primary mt-5" onClick={() => window.location.reload()}>Recargar aplicación</button></div></div>
    }
    return this.props.children
  }
}

function App() {
  const { state, notify, loadWorkspace } = useWorkspace()
  const [selectedTask, setSelectedTask] = useState(null)
  const task = selectedTask ? state.tasks[selectedTask] : null

  return <Layout><Routes><Route path="/board" element={<BoardFrame setSelectedTask={setSelectedTask} />} /><Route path="/gantt" element={<GanttFrame state={state} notify={notify} reload={loadWorkspace} />} /><Route path="/integrations" element={<IntegrationsFrame notify={notify} />} /><Route path="/settings" element={<SettingsFrame notify={notify} />} /><Route path="/profile" element={<ProfileFrame notify={notify} />} /><Route path="/" element={<Navigate to="/board" replace />} /><Route path="*" element={<NotFound />} /></Routes>{task && <TaskModal task={task} close={() => setSelectedTask(null)} />}</Layout>
}

function NotFound() {
  return <div className="empty-state"><h3 className="font-display text-lg font-semibold">Página no encontrada</h3><p className="mt-2 max-w-sm text-xs leading-5 text-carbon/50">La ruta solicitada no existe.</p><a href="/board" className="button-primary mt-5">Volver al tablero</a></div>
}

const rootElement = document.getElementById('root')
const appRoot = window.__voltageRoot || createRoot(rootElement)
window.__voltageRoot = appRoot
appRoot.render(<AppErrorBoundary><BrowserRouter><WorkspaceProvider><App /></WorkspaceProvider></BrowserRouter></AppErrorBoundary>)

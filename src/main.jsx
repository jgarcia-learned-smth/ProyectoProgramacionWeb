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

function App() {
  const { state, notify } = useWorkspace()
  const [selectedTask, setSelectedTask] = useState(null)
  const task = selectedTask ? state.tasks[selectedTask] : null

  return <Layout><Routes><Route path="/board" element={<BoardFrame setSelectedTask={setSelectedTask} />} /><Route path="/gantt" element={<GanttFrame state={state} notify={notify} />} /><Route path="/integrations" element={<IntegrationsFrame notify={notify} />} /><Route path="/settings" element={<SettingsFrame notify={notify} />} /><Route path="/profile" element={<ProfileFrame notify={notify} />} /><Route path="/" element={<Navigate to="/board" replace />} /><Route path="*" element={<Navigate to="/board" replace />} /></Routes>{task && <TaskModal task={task} close={() => setSelectedTask(null)} />}</Layout>
}

const rootElement = document.getElementById('root')
const appRoot = window.__voltageRoot || createRoot(rootElement)
window.__voltageRoot = appRoot
appRoot.render(<BrowserRouter><WorkspaceProvider><App /></WorkspaceProvider></BrowserRouter>)

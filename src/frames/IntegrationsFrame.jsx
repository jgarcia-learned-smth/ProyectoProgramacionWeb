import { Check, PlugZap, RefreshCw, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, EmptyState, FrameHeader } from '../components/Shared.jsx'
import { connectIntegration, getIntegrations } from '../services/accountService.js'

const iconByName = { Slack: 'S', Trello: 'T' }

export default function IntegrationsFrame() {
  const [integrations, setIntegrations] = useState([])
  const [connectingId, setConnectingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCatalog = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getIntegrations()
      setIntegrations(result.integrations || result || [])
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cargar el catálogo de integraciones.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const connect = async (integration) => {
    setConnectingId(integration.id)
    setError('')
    try {
      const result = await connectIntegration(integration.id)
      setIntegrations((current) => current.map((item) => item.id === integration.id ? { ...item, ...(result.integration || result), connected: true } : item))
    } catch (requestError) {
      setError(requestError.message || `No se pudo conectar ${integration.name}.`)
    } finally {
      setConnectingId(null)
    }
  }

  if (isLoading) return <EmptyState title="Cargando integraciones" description="Consultando conexiones disponibles en el backend." />
  if (error && !integrations.length) return <EmptyState title="No se pudo cargar el catálogo" description={error} action={<Button onClick={loadCatalog}>Reintentar</Button>} />
  if (!integrations.length) return <EmptyState title="No hay integraciones disponibles" description="El backend todavía no ha publicado conexiones para este workspace." action={<Button variant="secondary" onClick={loadCatalog}><RefreshCw size={14} /> Actualizar catálogo</Button>} />

  return <div><FrameHeader eyebrow="Conexiones de red" title="Integraciones" description="Conecta tus herramientas para que el trabajo mantenga la carga." action={<Button variant="secondary" onClick={loadCatalog} disabled={isLoading}><RefreshCw size={14} /> Actualizar catálogo</Button>} />{error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}<div className="grid grid-cols-3 gap-4">{integrations.map((integration) => <article key={integration.id} className="integration-card"><div className="integration-icon bg-paper text-lg font-bold">{integration.icon ? <img src={integration.icon} alt="" className="h-6 w-6" /> : iconByName[integration.name] || <PlugZap size={24} />}</div><div className="mt-5 flex items-start justify-between"><div><h4 className="font-display text-lg font-semibold">{integration.name}</h4><p className="mt-1 text-xs leading-5 text-carbon/50">{integration.detail || integration.description}</p></div>{integration.connected && <span className="flex items-center gap-1 text-[10px] font-bold text-[#438363]"><Check size={13} /> Conectado</span>}</div><Button variant={integration.connected ? 'secondary' : 'primary'} onClick={() => connect(integration)} disabled={connectingId === integration.id || integration.connected}>{connectingId === integration.id ? 'Conectando...' : integration.connected ? 'Conectado' : 'Conectar'} <PlugZap size={14} /></Button></article>)}</div><div className="mt-5 rounded-2xl border border-dashed border-ground bg-white/40 p-8 text-center"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-voltage"><Zap size={18} /></div><p className="text-sm font-semibold">¿No encuentras tu integración?</p><p className="mt-1 text-xs text-carbon/50">El catálogo se actualiza desde el backend.</p></div></div>
}

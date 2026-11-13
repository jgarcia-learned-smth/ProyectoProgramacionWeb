import React, { useState } from 'react'
import { Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LoginFrame({ signIn }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/board', { replace: true })
    } catch (requestError) {
      setError(typeof requestError.message === 'string' ? requestError.message : 'No se pudo iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10 text-carbon">
      <section className="w-full max-w-md rounded-3xl border border-ground bg-white p-8 shadow-[0_20px_60px_rgba(42,40,33,.08)] sm:p-10">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-carbon text-voltage">
            <Zap size={21} fill="currentColor" />
          </div>
          <span className="font-display text-2xl font-extrabold tracking-[-0.05em]">voltage<span className="text-voltage">.</span></span>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-carbon/45">Workspace de proyectos</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">Inicia sesión</h1>
        <p className="mt-2 text-sm leading-6 text-carbon/55">Ingresa tus credenciales para acceder al dashboard.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-xs font-bold" htmlFor="login-email">Correo electrónico</label>
            <input
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border border-ground bg-paper px-4 py-3 text-sm outline-none transition focus:border-carbon focus:ring-4 focus:ring-voltage/20"
              id="login-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@correo.com"
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold" htmlFor="login-password">Contraseña</label>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-ground bg-paper px-4 py-3 text-sm outline-none transition focus:border-carbon focus:ring-4 focus:ring-voltage/20"
              id="login-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

          <button className="button-primary w-full justify-center py-3 text-sm" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Verificando…' : 'Entrar al dashboard'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-carbon/45">El acceso requiere una cuenta válida del proyecto.</p>
      </section>
    </main>
  )
}

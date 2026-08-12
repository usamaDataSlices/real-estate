import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const { sessionState, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  if (sessionState === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  if (sessionState === 'loading') {
    return <div className="card">Loading...</div>
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!isSupabaseConfigured) {
      setError('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before logging in.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      setEmail('')
      setPassword('')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-dark">Real Estate Portal</p>
        <h1 className="text-3xl font-heading font-semibold text-primary">Sign in</h1>
        <p className="text-neutral-600">One login for listings, bookings, and admin tools.</p>
      </div>

      <form className="card space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
    </div>
  )
}

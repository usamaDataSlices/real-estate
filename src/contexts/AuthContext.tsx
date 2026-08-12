import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ensureAdminProfile, signIn, signOut } from '../lib/auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type AuthUser = {
  id: string
  email?: string
}

type SessionState = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  sessionState: SessionState
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        setSessionState('unauthenticated')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await ensureAdminProfile(data.session.user.id, data.session.user.email)
        setUser({ id: data.session.user.id, email: data.session.user.email ?? undefined })
        setSessionState('authenticated')
      } else {
        setSessionState('unauthenticated')
      }
    }

    void load()

    if (!isSupabaseConfigured) return

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureAdminProfile(session.user.id, session.user.email)
        setUser({ id: session.user.id, email: session.user.email ?? undefined })
        setSessionState('authenticated')
      } else {
        setUser(null)
        setSessionState('unauthenticated')
      }
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      sessionState,
      user,
      login: async (email, password) => {
        await signIn(email, password)
      },
      logout: async () => {
        await signOut()
      },
    }),
    [sessionState, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

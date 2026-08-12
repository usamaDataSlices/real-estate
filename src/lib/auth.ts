import { supabase } from './supabase'

export async function ensureAdminProfile(userId: string, email?: string | null) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: email ?? null,
    role: 'admin',
  })

  if (error) {
    console.warn('Could not ensure admin profile:', error.message)
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (data.user) {
    await ensureAdminProfile(data.user.id, data.user.email)
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requireAuthSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session) {
    throw new Error('Your session expired. Please sign in again.')
  }
  return data.session
}

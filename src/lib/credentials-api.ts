import type { Credential } from '../types/credential'
import { makeId } from './id'
import { supabase } from './supabase'

function mapCredential(row: {
  id: string
  title: string
  username: string
  password: string
  url: string
  notes: string
  created_at?: string
  updated_at?: string
}): Credential {
  return {
    id: row.id,
    title: row.title,
    username: row.username,
    password: row.password,
    url: row.url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const CREDENTIAL_SELECT = 'id,title,username,password,url,notes,created_at,updated_at'

export async function fetchCredentials(): Promise<Credential[]> {
  const { data, error } = await supabase
    .from('credentials')
    .select(CREDENTIAL_SELECT)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapCredential)
}

export async function fetchCredentialById(id: string): Promise<Credential> {
  const { data, error } = await supabase.from('credentials').select(CREDENTIAL_SELECT).eq('id', id).single()
  if (error) throw error
  return mapCredential(data)
}

export async function upsertCredential(payload: {
  id?: string
  title: string
  username: string
  password: string
  url: string
  notes: string
}) {
  const title = payload.title.trim()
  if (!title) throw new Error('Credential title is required.')

  const id = payload.id ?? makeId()
  const updatedAt = new Date().toISOString()

  const { error } = await supabase.from('credentials').upsert({
    id,
    title,
    username: payload.username.trim(),
    password: payload.password,
    url: payload.url.trim(),
    notes: payload.notes,
    updated_at: updatedAt,
  })

  if (error) throw error
  return fetchCredentialById(id)
}

export async function deleteCredential(id: string) {
  const { error } = await supabase.from('credentials').delete().eq('id', id)
  if (error) throw error
}

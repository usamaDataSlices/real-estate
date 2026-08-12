import type { Note } from '../types/note'
import { makeId } from './id'
import { supabase } from './supabase'

function mapNote(row: {
  id: string
  title: string
  body: string
  created_at?: string
  updated_at?: string
}): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id,title,body,created_at,updated_at')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapNote)
}

export async function upsertNote(payload: { id?: string; title: string; body: string }) {
  const title = payload.title.trim()
  if (!title) throw new Error('Note title is required.')

  const noteId = payload.id ?? makeId()
  const { error } = await supabase.from('notes').upsert({
    id: noteId,
    title,
    body: payload.body,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  return noteId
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

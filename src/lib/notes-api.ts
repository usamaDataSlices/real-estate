import type { JSONContent } from '@tiptap/react'
import type { Note, NoteAttachment } from '../types/note'
import { noteMatchesSearch, parseNoteSearch } from './note-search'
import { makeId } from './id'
import { tiptapJsonToPlaintext } from './tiptap/content'
import { sanitizeNoteContentForSave, collectNoteImageStoragePaths } from './tiptap/note-content'
import { noteDebugJson } from './notes-debug'
import { supabase } from './supabase'

function mapNote(row: {
  id: string
  title: string
  body?: string
  content_json: JSONContent
  content_plain: string
  created_at?: string
  updated_at?: string
}): Note {
  return {
    id: row.id,
    title: row.title,
    contentJson: row.content_json,
    contentPlain: row.content_plain || row.body || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAttachment(row: {
  id: string
  note_id: string
  user_id: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  created_at?: string
}): NoteAttachment {
  return {
    id: row.id,
    noteId: row.note_id,
    userId: row.user_id,
    filePath: row.file_path,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  }
}

const NOTE_SELECT = 'id,title,content_json,content_plain,body,created_at,updated_at'
const NOTE_LIST_SELECT = 'id,title,content_plain,created_at,updated_at'

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_LIST_SELECT)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) =>
    mapNote({
      ...row,
      content_json: { type: 'doc', content: [] },
    }),
  )
}

export async function fetchNoteById(id: string): Promise<Note> {
  const { data, error } = await supabase.from('notes').select(NOTE_SELECT).eq('id', id).single()

  if (error) throw error
  const note = mapNote(data)
  noteDebugJson('fetchNoteById', {
    id: note.id,
    contentJson: note.contentJson,
    storagePaths: collectNoteImageStoragePaths(note.contentJson),
  })
  return note
}

export async function searchNotesServer(query: string, exact: boolean): Promise<Note[]> {
  const trimmed = query.trim()
  if (!trimmed) return fetchNotes()

  const parsed = parseNoteSearch(exact ? `"${trimmed.replace(/"/g, '')}"` : trimmed)

  if (!parsed.exact) {
    const { data, error } = await supabase
      .from('notes')
      .select(NOTE_LIST_SELECT)
      .textSearch('search_vector', trimmed, { type: 'websearch', config: 'english' })
      .order('updated_at', { ascending: false })

    if (!error && data) {
      return data.map((row) => mapNote({ ...row, content_json: { type: 'doc', content: [] } }))
    }
  }

  const all = await fetchNotes()
  return all.filter((note) => noteMatchesSearch(note, parsed))
}

export async function upsertNote(payload: {
  id?: string
  title: string
  contentJson: JSONContent
}) {
  const title = payload.title.trim()
  if (!title) throw new Error('Note title is required.')

  const contentJson = sanitizeNoteContentForSave(payload.contentJson)
  const contentPlain = tiptapJsonToPlaintext(contentJson)
  const noteId = payload.id ?? makeId()
  const updatedAt = new Date().toISOString()

  const { error } = await supabase.from('notes').upsert({
    id: noteId,
    title,
    content_json: contentJson,
    content_plain: contentPlain,
    body: contentPlain,
    updated_at: updatedAt,
  })

  if (error) throw error
  return { id: noteId, title, contentJson, contentPlain, updatedAt }
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function fetchNoteAttachments(noteId: string): Promise<NoteAttachment[]> {
  const { data, error } = await supabase
    .from('note_attachments')
    .select('id,note_id,user_id,file_path,file_name,file_type,file_size,created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapAttachment)
}

export async function deleteNoteAttachment(id: string, filePath: string) {
  const { error: storageError } = await supabase.storage.from('note-attachments').remove([filePath])
  if (storageError) throw storageError

  const { error } = await supabase.from('note_attachments').delete().eq('id', id)
  if (error) throw error
}

export async function createSignedAttachmentUrl(filePath: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from('note-attachments').createSignedUrl(filePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}

import { makeId } from './id'
import {
  NOTE_ATTACHMENT_BUCKET,
  noteAttachmentPath,
  validateNoteFile,
} from './note-uploads'
import { supabase } from './supabase'
import type { NoteAttachment } from '../types/note'

export type UploadProgress = {
  loaded: number
  total: number
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-()+\s]/g, '_').replace(/\s+/g, '-')
}

export async function uploadInlineNoteImage(
  file: File,
  userId: string,
  noteId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ signedUrl: string; storagePath: string }> {
  validateNoteFile(file, 'inline-image')

  const filename = `${makeId()}-${sanitizeFilename(file.name)}`
  const path = noteAttachmentPath(userId, noteId, filename)

  onProgress?.({ loaded: 0, total: file.size })

  const { error } = await supabase.storage.from(NOTE_ATTACHMENT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (error) throw error

  onProgress?.({ loaded: file.size, total: file.size })

  const { data, error: signError } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  if (signError) throw signError

  return { signedUrl: data.signedUrl, storagePath: path }
}

export async function uploadNoteDocument(
  file: File,
  userId: string,
  noteId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<NoteAttachment> {
  validateNoteFile(file, 'document')

  const filename = `${makeId()}-${sanitizeFilename(file.name)}`
  const path = noteAttachmentPath(userId, noteId, filename)

  onProgress?.({ loaded: 0, total: file.size })

  const { error: uploadError } = await supabase.storage.from(NOTE_ATTACHMENT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) throw uploadError

  onProgress?.({ loaded: file.size, total: file.size })

  const attachmentId = makeId()
  const { data, error } = await supabase
    .from('note_attachments')
    .insert({
      id: attachmentId,
      note_id: noteId,
      user_id: userId,
      file_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    })
    .select('id,note_id,user_id,file_path,file_name,file_type,file_size,created_at')
    .single()

  if (error) throw error

  return {
    id: data.id,
    noteId: data.note_id,
    userId: data.user_id,
    filePath: data.file_path,
    fileName: data.file_name,
    fileType: data.file_type,
    fileSize: data.file_size,
    createdAt: data.created_at,
  }
}

export async function refreshInlineImageUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

  if (error) throw error
  return data.signedUrl
}

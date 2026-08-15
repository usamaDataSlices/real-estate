import { makeId } from './id'
import { supabase } from './supabase'
import type { TicketAttachment } from '../types/ticket'
import { TICKET_ATTACHMENT_BUCKET, ticketAttachmentPath, validateTicketFile } from './ticket-uploads'

export type UploadProgress = {
  loaded: number
  total: number
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-()+\s]/g, '_').replace(/\s+/g, '-')
}

export async function uploadTicketDocument(
  file: File,
  userId: string,
  ticketId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<TicketAttachment> {
  validateTicketFile(file)

  const filename = `${makeId()}-${sanitizeFilename(file.name)}`
  const path = ticketAttachmentPath(userId, ticketId, filename)

  onProgress?.({ loaded: 0, total: file.size })

  const { error: uploadError } = await supabase.storage.from(TICKET_ATTACHMENT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) throw uploadError

  onProgress?.({ loaded: file.size, total: file.size })

  const attachmentId = makeId()
  const { data, error } = await supabase
    .from('ticket_attachments')
    .insert({
      id: attachmentId,
      ticket_id: ticketId,
      user_id: userId,
      file_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    })
    .select('id,ticket_id,user_id,file_path,file_name,file_type,file_size,created_at')
    .single()

  if (error) throw error

  return {
    id: data.id,
    ticketId: data.ticket_id,
    userId: data.user_id,
    filePath: data.file_path,
    fileName: data.file_name,
    fileType: data.file_type,
    fileSize: data.file_size,
    createdAt: data.created_at,
  }
}

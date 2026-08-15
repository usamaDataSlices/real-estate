export const TICKET_ATTACHMENT_BUCKET = 'ticket-attachments'
export const TICKET_MAX_FILE_BYTES = 20 * 1024 * 1024

export const TICKET_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export { formatFileSize } from './note-uploads'

export function validateTicketFile(file: File) {
  if (file.size > TICKET_MAX_FILE_BYTES) {
    throw new Error(`File exceeds ${(TICKET_MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB limit.`)
  }

  if (!TICKET_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type || 'unknown'}`)
  }
}

export function ticketAttachmentPath(userId: string, ticketId: string, filename: string) {
  return `${userId}/${ticketId}/${filename}`
}

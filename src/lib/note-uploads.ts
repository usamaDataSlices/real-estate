export const NOTE_ATTACHMENT_BUCKET = 'note-attachments'
export const NOTE_MAX_FILE_BYTES = 20 * 1024 * 1024

export const NOTE_INLINE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

export const NOTE_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateNoteFile(file: File, mode: 'inline-image' | 'document') {
  if (file.size > NOTE_MAX_FILE_BYTES) {
    throw new Error(`File exceeds ${formatFileSize(NOTE_MAX_FILE_BYTES)} limit.`)
  }

  const allowed = mode === 'inline-image' ? NOTE_INLINE_IMAGE_TYPES : NOTE_DOCUMENT_TYPES
  if (!allowed.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type || 'unknown'}`)
  }
}

export function noteAttachmentPath(userId: string, noteId: string, filename: string) {
  return `${userId}/${noteId}/${filename}`
}

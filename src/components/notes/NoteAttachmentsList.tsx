import { useState } from 'react'
import { Download, Loader2, Trash2 } from 'lucide-react'
import { createSignedAttachmentUrl, deleteNoteAttachment } from '../../lib/notes-api'
import { formatFileSize } from '../../lib/note-uploads'
import type { NoteAttachment } from '../../types/note'

type Props = {
  attachments: NoteAttachment[]
  loading?: boolean
  uploadProgress?: number | null
  onUploadClick: () => void
  onDeleted: () => void
  onError: (message: string) => void
}

export default function NoteAttachmentsList({
  attachments,
  loading,
  uploadProgress,
  onUploadClick,
  onDeleted,
  onError,
}: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDownload = async (attachment: NoteAttachment) => {
    setDownloadingId(attachment.id)
    try {
      const url = await createSignedAttachmentUrl(attachment.filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.fileName
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Download failed.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (attachment: NoteAttachment) => {
    setDeletingId(attachment.id)
    try {
      await deleteNoteAttachment(attachment.id, attachment.filePath)
      onDeleted()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Attachments</h3>
        <button type="button" className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm" onClick={onUploadClick}>
          Add file
        </button>
      </div>

      {uploadProgress !== null && uploadProgress !== undefined ? (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-neutral-500">Uploading… {Math.round(uploadProgress)}%</p>
        </div>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading attachments…
        </p>
      ) : attachments.length > 0 ? (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{attachment.fileName}</p>
                <p className="text-xs text-neutral-500">
                  {formatFileSize(attachment.fileSize)} · {attachment.fileType || 'file'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
                  title="Download"
                  onClick={() => void handleDownload(attachment)}
                  disabled={downloadingId === attachment.id}
                >
                  {downloadingId === attachment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  className="rounded-md p-2 text-danger hover:bg-danger/5"
                  title="Remove"
                  onClick={() => void handleDelete(attachment)}
                  disabled={deletingId === attachment.id}
                >
                  {deletingId === attachment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
          PDF, Word, Excel, CSV, and text files up to 20 MB.
        </p>
      )}
    </div>
  )
}

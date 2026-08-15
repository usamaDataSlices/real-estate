import { useRef, useState } from 'react'
import { Download, Loader2, Paperclip, Trash2 } from 'lucide-react'
import { createSignedTicketAttachmentUrl, deleteTicketAttachment } from '../../lib/tickets-api'
import { uploadTicketDocument } from '../../lib/ticket-attachments-api'
import { formatFileSize } from '../../lib/ticket-uploads'
import type { TicketAttachment } from '../../types/ticket'

type Props = {
  ticketId: string
  userId: string
  attachments: TicketAttachment[]
  loading?: boolean
  onChanged: () => void
  onError: (message: string) => void
}

export default function TicketAttachmentsList({
  ticketId,
  userId,
  attachments,
  loading,
  onChanged,
  onError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      await uploadTicketDocument(file, userId, ticketId, (progress) => {
        setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
      })
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDownload = async (attachment: TicketAttachment) => {
    setDownloadingId(attachment.id)
    try {
      const url = await createSignedTicketAttachmentUrl(attachment.filePath)
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

  const handleDelete = async (attachment: TicketAttachment) => {
    setDeletingId(attachment.id)
    try {
      await deleteTicketAttachment(attachment.id, attachment.filePath)
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Attachments {attachments.length > 0 ? `(${attachments.length})` : ''}
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="h-3 w-3" />
          Attach
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void handleUpload(file)
          }}
        />
      </div>

      {uploadProgress !== null ? (
        <div className="space-y-0.5">
          <div className="h-1 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-[10px] text-neutral-500">Uploading… {uploadProgress}%</p>
        </div>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading…
        </p>
      ) : attachments.length > 0 ? (
        <ul className="divide-y divide-neutral-100 rounded border border-neutral-200">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between gap-2 px-2 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-neutral-900">{attachment.fileName}</p>
                <p className="text-[10px] text-neutral-500">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                  title="Download"
                  onClick={() => void handleDownload(attachment)}
                  disabled={downloadingId === attachment.id}
                >
                  {downloadingId === attachment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-danger hover:bg-danger/5"
                  title="Remove"
                  onClick={() => void handleDelete(attachment)}
                  disabled={deletingId === attachment.id}
                >
                  {deletingId === attachment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-neutral-200 px-3 py-2 text-center text-[11px] text-neutral-500">
          PDF, Office, images, CSV, text — up to 20 MB
        </p>
      )}
    </div>
  )
}

import { useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { ArrowUpDown, Download, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { makeId } from '../lib/id'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ListingImage } from '../types/listing'
import ImageOrderModal from './ImageOrderModal'

export type UploadItem = ListingImage & {
  file?: File
  path?: string
}

type Props = {
  propertyId?: string
  value: UploadItem[]
  onChange: (next: UploadItem[]) => void
}

async function fileToPublicUrl(file: File, propertyId: string) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })

  const ext = compressed.name.split('.').pop() || 'jpg'
  const path = `${propertyId}/${makeId()}.${ext}`

  const { error } = await supabase.storage
    .from('property-images')
    .upload(path, compressed, {
      cacheControl: '31536000',
      upsert: false,
      contentType: compressed.type,
    })

  if (error) throw error

  const { data } = supabase.storage.from('property-images').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

function extensionFromUrl(url: string) {
  const clean = url.split('?')[0]
  const match = clean.match(/\.([a-zA-Z0-9]+)$/)
  return match?.[1] ?? 'jpg'
}

async function downloadImage(image: UploadItem, index: number) {
  const filename = `property-image-${index + 1}.${extensionFromUrl(image.url)}`

  try {
    const response = await fetch(image.url)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    saveAs(blob, filename)
    return
  } catch {
    const link = document.createElement('a')
    link.href = image.url
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}

export default function ImageUploader({ propertyId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const sortedImages = useMemo(() => [...value].sort((a, b) => a.sortOrder - b.sortOrder), [value])

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    if (!propertyId) {
      setProgress('Save the listing first, then upload images.')
      return
    }
    if (!isSupabaseConfigured) {
      setProgress('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to upload images.')
      return
    }

    setUploading(true)
    setProgress('Uploading images...')

    try {
      const next = [...value]
      for (const file of Array.from(files)) {
        const uploaded = await fileToPublicUrl(file, propertyId)
        next.push({
          id: makeId(),
          url: uploaded.url,
          sortOrder: next.length,
          isCover: next.length === 0 && value.length === 0,
          file,
          path: uploaded.path,
          storagePath: uploaded.path,
        })
      }
      onChange(next)
      setProgress('Upload complete.')
    } catch (error) {
      setProgress(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (id: string) => {
    const target = value.find((image) => image.id === id)
    if (target?.path && isSupabaseConfigured) {
      await supabase.storage.from('property-images').remove([target.path])
    }
    const next = value.filter((image) => image.id !== id).map((image, index) => ({ ...image, sortOrder: index, isCover: index === 0 }))
    onChange(next)
  }

  const handleDownload = async (image: UploadItem, index: number) => {
    setDownloadingId(image.id)
    setProgress(null)
    try {
      await downloadImage(image, index)
    } catch (error) {
      setProgress(error instanceof Error ? error.message : 'Download failed.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDownloadAll = async () => {
    setDownloadingAll(true)
    setProgress(null)
    try {
      for (let index = 0; index < sortedImages.length; index += 1) {
        await downloadImage(sortedImages[index], index)
      }
      setProgress('All images downloaded.')
    } catch (error) {
      setProgress(error instanceof Error ? error.message : 'Download failed.')
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900">Property images</h3>
            <p className="text-sm text-neutral-600">Upload and download property photos. Use Reorder to sort images and set the cover.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedImages.length > 1 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                onClick={() => setOrderModalOpen(true)}
                disabled={uploading || downloadingAll}
              >
                <ArrowUpDown className="h-4 w-4" />
                Reorder
              </button>
            ) : null}
            {sortedImages.length > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                onClick={() => void handleDownloadAll()}
                disabled={downloadingAll || uploading}
              >
                {downloadingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download all
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || downloadingAll}
            >
              {uploading ? 'Uploading...' : 'Add images'}
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => void addFiles(event.target.files)}
        />

        {progress ? <p className="text-sm text-neutral-600">{progress}</p> : null}

        {sortedImages.length ? (
          <ul className="space-y-3">
            {sortedImages.map((image, index) => (
              <li
                key={image.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-start"
              >
                <img
                  src={image.url}
                  alt={`Property image ${index + 1}`}
                  className="h-36 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-36"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">Image {index + 1}</span>
                    {image.isCover ? <span className="text-xs font-medium text-primary">Cover photo</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
                      onClick={() => void handleDownload(image, index)}
                      disabled={downloadingId === image.id || downloadingAll}
                    >
                      {downloadingId === image.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5"
                      onClick={() => void removeImage(image.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center text-neutral-600">
            No images yet.
          </div>
        )}
      </div>

      <ImageOrderModal
        open={orderModalOpen}
        images={sortedImages}
        onClose={() => setOrderModalOpen(false)}
        onSave={onChange}
      />
    </>
  )
}

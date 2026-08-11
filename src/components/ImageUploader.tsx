import { useMemo, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ListingImage } from '../types/listing'

export type UploadItem = ListingImage & {
  file?: File
  path?: string
}

type Props = {
  propertyId?: string
  value: UploadItem[]
  onChange: (next: UploadItem[]) => void
}

function makeId() {
  return crypto.randomUUID()
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

export default function ImageUploader({ propertyId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
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

  const setCover = (id: string) => {
    onChange(sortedImages.map((image) => ({ ...image, isCover: image.id === id })))
  }

  const move = (id: string, direction: -1 | 1) => {
    const index = sortedImages.findIndex((image) => image.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= sortedImages.length) return
    const next = [...sortedImages]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next.map((image, order) => ({ ...image, sortOrder: order })))
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-neutral-900">Property images</h3>
          <p className="text-sm text-neutral-600">Drag, upload, reorder, and set a cover photo.</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Add images'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void addFiles(e.target.files)}
      />

      {progress ? <p className="text-sm text-neutral-600">{progress}</p> : null}

      {sortedImages.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedImages.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <img src={image.url} alt="Property preview" className="h-48 w-full object-cover" />
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <button type="button" className="text-sm text-primary" onClick={() => setCover(image.id)}>
                    {image.isCover ? 'Cover photo' : 'Set cover'}
                  </button>
                  <span className="text-xs text-neutral-600">#{image.sortOrder + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-md border border-neutral-200 px-2 py-1 text-sm" onClick={() => move(image.id, -1)}>
                    Up
                  </button>
                  <button type="button" className="rounded-md border border-neutral-200 px-2 py-1 text-sm" onClick={() => move(image.id, 1)}>
                    Down
                  </button>
                  <button type="button" className="rounded-md border border-danger px-2 py-1 text-sm text-danger" onClick={() => void removeImage(image.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-neutral-600">
          No images yet.
        </div>
      )}
    </div>
  )
}

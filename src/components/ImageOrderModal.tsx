import { useEffect, useMemo, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { ListingImage } from '../types/listing'

type OrderItem = ListingImage & {
  file?: File
  path?: string
}

type Props = {
  open: boolean
  images: OrderItem[]
  onClose: () => void
  onSave: (ordered: OrderItem[]) => void
}

function sortByOrder(images: OrderItem[]) {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder)
}

export default function ImageOrderModal({ open, images, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<OrderItem[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const sortedDraft = useMemo(() => sortByOrder(draft), [draft])

  useEffect(() => {
    if (!open) return
    setDraft(sortByOrder(images))
    setDraggedId(null)
    setDragOverId(null)
  }, [open, images])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const reorder = (fromId: string, toId: string) => {
    const fromIndex = sortedDraft.findIndex((image) => image.id === fromId)
    const toIndex = sortedDraft.findIndex((image) => image.id === toId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

    const next = [...sortedDraft]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setDraft(next.map((image, order) => ({ ...image, sortOrder: order })))
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const handleDragOver = (event: React.DragEvent<HTMLLIElement>, id: string) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }

  const handleDrop = (event: React.DragEvent<HTMLLIElement>, toId: string) => {
    event.preventDefault()
    const fromId = event.dataTransfer.getData('text/plain') || draggedId
    if (fromId) reorder(fromId, toId)
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const setCover = (id: string) => {
    setDraft(sortedDraft.map((image) => ({ ...image, isCover: image.id === id })))
  }

  const handleSave = () => {
    onSave(sortedDraft)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-neutral-900/45 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-order-modal-title"
        className="relative flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div>
            <h2 id="image-order-modal-title" className="text-lg font-semibold text-neutral-900">
              Reorder & cover
            </h2>
            <p className="mt-1 text-sm text-neutral-600">Drag to reorder and choose which image is the cover photo.</p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-5">
          {sortedDraft.map((image, index) => (
            <li
              key={image.id}
              onDragOver={(event) => handleDragOver(event, image.id)}
              onDragLeave={() => setDragOverId((current) => (current === image.id ? null : current))}
              onDrop={(event) => handleDrop(event, image.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors ${
                dragOverId === image.id && draggedId !== image.id
                  ? 'border-primary bg-primary/5'
                  : 'border-neutral-200'
              } ${draggedId === image.id ? 'opacity-50' : ''}`}
            >
              <div
                draggable
                onDragStart={(event) => handleDragStart(event, image.id)}
                className="flex shrink-0 cursor-grab items-center self-stretch rounded-md border border-neutral-200 bg-neutral-50 px-1.5 text-neutral-400 active:cursor-grabbing"
                title="Drag to reorder"
                aria-label={`Drag to reorder image ${index + 1}`}
              >
                <GripVertical className="h-5 w-5" />
              </div>
              <img
                src={image.url}
                alt={`Property image ${index + 1}`}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                draggable={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-neutral-900">Image {index + 1}</p>
                  <button
                    type="button"
                    className={`text-sm font-medium ${image.isCover ? 'text-primary' : 'text-neutral-600 hover:text-primary'}`}
                    onClick={() => setCover(image.id)}
                  >
                    {image.isCover ? 'Cover photo' : 'Set as cover'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-200 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            onClick={handleSave}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

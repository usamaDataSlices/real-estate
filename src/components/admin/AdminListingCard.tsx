import { Plus } from 'lucide-react'
import type { Listing } from '../../types/listing'

type Props = {
  item: Listing
  onEdit: () => void
  onAddDocument: () => void
  onDelete: () => void
}

export default function AdminListingCard({ item, onEdit, onAddDocument, onDelete }: Props) {
  return (
    <article className="card group relative space-y-3 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-primary transition-colors group-hover:text-accent-dark">{item.title}</h3>
          <p className="text-sm text-neutral-600">
            {item.city}
            {item.area ? ` · ${item.area}` : ''}
          </p>
        </div>
        <span className={item.status === 'published' ? 'badge-success' : 'badge-warning'}>{item.status}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
        <span className="rounded bg-neutral-100 px-2 py-1">{item.type}</span>
        <span className="rounded bg-neutral-100 px-2 py-1">{item.bedrooms} bed</span>
        <span className="rounded bg-neutral-100 px-2 py-1">{item.bathrooms} bath</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
        <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={onEdit}>
          Edit Property
        </button>
        <button
          type="button"
          className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
          onClick={onAddDocument}
        >
          <Plus className="mr-1 inline-block h-3 w-3" /> Add Document
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

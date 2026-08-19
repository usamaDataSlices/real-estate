import { Loader2 } from 'lucide-react'
import AdminListingForm, { type AdminListingSubmitPayload } from '../AdminListingForm'
import PropertyExcelImporter from '../PropertyExcelImporter'
import AdminListingCard from './AdminListingCard'
import type { Listing } from '../../types/listing'

type Props = {
  items: Listing[]
  editing: Listing | null
  saving: boolean
  counts: { total: number; published: number; draft: number }
  onEdit: (listing: Listing) => void
  onCancelEdit: () => void
  onSave: (payload: AdminListingSubmitPayload) => void
  onDelete: (listing: Listing) => void
  onAddDocument: (listing: Listing) => void
  onImportComplete: () => void
  onImportMessage: (message: string) => void
}

export default function AdminListingsTab({
  items,
  editing,
  saving,
  counts,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onAddDocument,
  onImportComplete,
  onImportMessage,
}: Props) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <PropertyExcelImporter
          onComplete={(summary) => {
            onImportComplete()
            const failed = summary.failed.length
            onImportMessage(
              failed > 0
                ? `Import finished with ${failed} failed row(s).`
                : `Import complete: ${summary.inserted} inserted, ${summary.updated} updated.`,
            )
          }}
        />

        <div className="flex gap-3">
          <div className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700">Total: {counts.total}</div>
          <div className="rounded-lg bg-green-100/50 px-3 py-1.5 text-xs font-semibold text-success">Published: {counts.published}</div>
          <div className="rounded-lg bg-orange-100/50 px-3 py-1.5 text-xs font-semibold text-warning">Drafts: {counts.draft}</div>
        </div>

        {items.length ? (
          items.map((item) => (
            <AdminListingCard
              key={item.id}
              item={item}
              onEdit={() => onEdit(item)}
              onAddDocument={() => onAddDocument(item)}
              onDelete={() => onDelete(item)}
            />
          ))
        ) : (
          <div className="card py-8 text-center text-neutral-500">No properties yet. Create the first listing on the right.</div>
        )}
      </div>

      <div className="card sticky top-24 max-h-[calc(100dvh-7rem)] self-start overflow-y-auto overscroll-contain">
        <h3 className="mb-4 text-xl font-semibold text-primary">{editing ? 'Edit Listing' : 'Create Listing'}</h3>
        <AdminListingForm value={editing} onSubmit={onSave} onCancel={onCancelEdit} />
        {saving ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving changes...
          </p>
        ) : null}
      </div>
    </section>
  )
}

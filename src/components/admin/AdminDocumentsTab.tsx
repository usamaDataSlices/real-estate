import { Download, FileEdit, FileText, Plus, Trash2 } from 'lucide-react'
import DocxUploader from '../DocxUploader'
import type { Listing } from '../../types/listing'
import type { PropertyDocument } from '../../types/document'

type Props = {
  documents: PropertyDocument[]
  listings: Listing[]
  uploading: boolean
  uploadTargetProperty: string
  onToggleUpload: () => void
  onUploadTargetChange: (propertyId: string) => void
  onParsedUpload: (title: string, html: string) => void
  onCreateBlank: () => void
  onEdit: (doc: PropertyDocument) => void
  onExport: (doc: PropertyDocument) => void
  onDelete: (doc: PropertyDocument) => void
}

export default function AdminDocumentsTab({
  documents,
  listings,
  uploading,
  uploadTargetProperty,
  onToggleUpload,
  onUploadTargetChange,
  onParsedUpload,
  onCreateBlank,
  onEdit,
  onExport,
  onDelete,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-primary">All Documents</h3>
          <p className="text-sm text-neutral-600">{documents.length} files stored securely.</p>
        </div>
        <button type="button" className="btn-primary flex items-center gap-2" onClick={onToggleUpload}>
          {uploading ? 'Cancel Upload' : <><Plus className="h-4 w-4" /> New Document</>}
        </button>
      </div>

      {uploading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h4 className="mb-4 text-lg font-semibold">Upload Existing DOCX</h4>
            <DocxUploader onParsed={onParsedUpload} />
          </div>
          <div className="card flex flex-col items-center justify-center border-dashed bg-neutral-50 p-8 text-center">
            <FileEdit className="mb-4 h-12 w-12 text-neutral-400" />
            <h4 className="mb-2 text-lg font-semibold text-primary">Create Blank Document</h4>
            <p className="mb-6 px-4 text-sm text-neutral-600">
              Start typing from scratch utilizing our rich-text builder to draft contracts or brochures.
            </p>
            {listings.length === 0 ? (
              <p className="text-sm font-medium text-danger">Please create a property listing first.</p>
            ) : (
              <div className="w-full max-w-xs space-y-3 text-left">
                <label className="block text-sm font-medium">Link to Property:</label>
                <select
                  className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                  value={uploadTargetProperty}
                  onChange={(event) => onUploadTargetChange(event.target.value)}
                >
                  <option value="">-- Select a property --</option>
                  {listings.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  disabled={!uploadTargetProperty && !listings[0]?.id}
                  onClick={onCreateBlank}
                >
                  Open Editor
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {!uploading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.length > 0 ? (
            documents.map((doc) => {
              const linkedProperty = listings.find((item) => item.id === doc.propertyId)
              return (
                <div key={doc.id} className="card group flex h-full flex-col transition-transform hover:-translate-y-1">
                  <div className="flex-1">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-neutral-400">
                        {new Date(doc.updatedAt || doc.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight text-primary">{doc.title}</h4>
                    <p className="inline-block max-w-full truncate rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                      Link: {linkedProperty?.title || 'Unknown Property'}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-accent-dark" onClick={() => onEdit(doc)}>
                      <FileEdit className="h-4 w-4" /> Edit
                    </button>
                    <button type="button" className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-primary" onClick={() => onExport(doc)}>
                      <Download className="h-4 w-4" /> Export
                    </button>
                    <button type="button" className="p-1 text-sm font-medium text-danger hover:text-danger" onClick={() => onDelete(doc)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center md:col-span-2 lg:col-span-3">
              <FileText className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <h3 className="text-lg font-medium text-primary">No Documents Found</h3>
              <p className="mx-auto mb-6 mt-1 max-w-md text-neutral-500">
                Upload DOCX contracts, brochures, or notes, and link them directly to your real estate listings.
              </p>
              <button type="button" className="btn-primary" onClick={onToggleUpload}>Upload First Document</button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

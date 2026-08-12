import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AdminHeader from '../components/admin/AdminHeader'
import AdminListingsTab from '../components/admin/AdminListingsTab'
import AdminDocumentsTab from '../components/admin/AdminDocumentsTab'
import AdminDocEditorView from '../components/admin/AdminDocEditorView'
import ConfirmModal from '../components/ConfirmModal'
import StatusBanner from '../components/ui/StatusBanner'
import type { AdminListingSubmitPayload } from '../components/AdminListingForm'
import { deleteDocument, fetchDocuments, upsertDocument } from '../lib/documents-api'
import { exportToDocx } from '../lib/export-docx'
import { makeId } from '../lib/id'
import { deleteListingWithImages, fetchListingsWithImages, listingFromFormValues, upsertListing } from '../lib/listings-api'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Listing } from '../types/listing'
import type { PropertyDocument } from '../types/document'

type ActiveTab = 'listings' | 'documents'

type DeleteTarget =
  | { type: 'listing'; id: string; title: string }
  | { type: 'document'; id: string; title: string }

type EditingDoc = {
  id?: string
  propertyId: string
  title: string
  content: string
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ActiveTab>('listings')
  const [message, setMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<Listing | null>(null)
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadTargetProperty, setUploadTargetProperty] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const listingsQuery = useQuery({
    queryKey: ['admin-listings'],
    queryFn: () => fetchListingsWithImages(),
    enabled: isSupabaseConfigured,
  })

  const documentsQuery = useQuery({
    queryKey: ['admin-documents'],
    queryFn: fetchDocuments,
    enabled: isSupabaseConfigured,
  })

  const items = listingsQuery.data ?? []
  const documents = documentsQuery.data ?? []

  const counts = useMemo(
    () => ({
      total: items.length,
      published: items.filter((item) => item.status === 'published').length,
      draft: items.filter((item) => item.status === 'draft').length,
      documents: documents.length,
    }),
    [items, documents],
  )

  const saveMutation = useMutation({
    mutationFn: upsertListing,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      await queryClient.invalidateQueries({ queryKey: ['public-listings'] })
      setMessage('Listing saved.')
      setEditing(null)
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Save failed.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteListingWithImages,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      await queryClient.invalidateQueries({ queryKey: ['public-listings'] })
      setMessage('Listing deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const saveDocMutation = useMutation({
    mutationFn: upsertDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      setMessage('Document saved.')
      setEditingDoc(null)
      setUploadingDoc(false)
    },
    onError: (error: unknown) => {
      const pgError = error as { code?: string; message?: string }
      const text = pgError.message ?? 'Save failed.'

      if (
        pgError.code === '42501'
        || text.toLowerCase().includes('row-level security')
        || text.toLowerCase().includes('permission denied')
      ) {
        setMessage('Save failed: not authorized. Sign out, sign in again, then run supabase/migrations/005_property_documents_complete.sql if it still fails.')
        return
      }

      setMessage(text)
    },
  })

  const deleteDocMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      setMessage('Document deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const saveListing = (payload: AdminListingSubmitPayload) => {
    setMessage(null)
    const id = editing?.id ?? makeId()
    void saveMutation.mutateAsync(listingFromFormValues(id, payload))
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'listing') {
      void deleteMutation.mutateAsync(deleteTarget.id).finally(() => setDeleteTarget(null))
      return
    }

    deleteDocMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    })
  }

  const deleteModalDescription =
    deleteTarget?.type === 'listing'
      ? `This will permanently remove "${deleteTarget.title}" and its linked images. This action cannot be undone.`
      : deleteTarget?.type === 'document'
        ? `This will permanently remove "${deleteTarget.title}". This action cannot be undone.`
        : ''

  if (editingDoc) {
    return (
      <AdminDocEditorView
        title={editingDoc.title}
        content={editingDoc.content}
        saving={saveDocMutation.isPending}
        onTitleChange={(title) => setEditingDoc((current) => (current ? { ...current, title } : null))}
        onSave={(content) => saveDocMutation.mutate({ ...editingDoc, content })}
        onExport={(content) => {
          void exportToDocx(content, `${editingDoc.title || 'document'}.docx`)
        }}
        onCancel={() => setEditingDoc(null)}
      />
    )
  }

  return (
    <div className="space-y-8">
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <StatusBanner message={message} />

      {activeTab === 'listings' ? (
        <AdminListingsTab
          items={items}
          editing={editing}
          saving={saveMutation.isPending}
          counts={counts}
          onEdit={setEditing}
          onCancelEdit={() => setEditing(null)}
          onSave={saveListing}
          onDelete={(listing) => setDeleteTarget({ type: 'listing', id: listing.id, title: listing.title })}
          onAddDocument={(listing) => {
            setActiveTab('documents')
            setUploadTargetProperty(listing.id)
            setUploadingDoc(true)
          }}
          onImportComplete={() => {
            void queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
            void queryClient.invalidateQueries({ queryKey: ['public-listings'] })
          }}
          onImportMessage={setMessage}
        />
      ) : (
        <AdminDocumentsTab
          documents={documents}
          listings={items}
          uploading={uploadingDoc}
          uploadTargetProperty={uploadTargetProperty}
          onToggleUpload={() => setUploadingDoc((current) => !current)}
          onUploadTargetChange={setUploadTargetProperty}
          onParsedUpload={(title, html) => {
            setEditingDoc({
              propertyId: uploadTargetProperty || items[0]?.id || '',
              title,
              content: html,
            })
          }}
          onCreateBlank={() => {
            setEditingDoc({
              propertyId: uploadTargetProperty || items[0]?.id || '',
              title: 'Untitled Document',
              content: '<h1>New Document</h1><p>Start typing here...</p>',
            })
          }}
          onEdit={(doc: PropertyDocument) => setEditingDoc(doc)}
          onExport={(doc) => {
            void exportToDocx(doc.content, `${doc.title}.docx`)
          }}
          onDelete={(doc) => setDeleteTarget({ type: 'document', id: doc.id, title: doc.title })}
        />
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteTarget?.type === 'listing' ? 'Delete listing?' : 'Delete document?'}
        description={deleteModalDescription}
        confirmLabel="Delete"
        loading={deleteMutation.isPending || deleteDocMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending && !deleteDocMutation.isPending) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

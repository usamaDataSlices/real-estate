import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Listing, ListingStatus } from '../types/listing'
import type { PropertyDocument } from '../types/document'
import AdminListingForm, { type AdminListingSubmitPayload } from '../components/AdminListingForm'
import { propertyRowToListing } from '../lib/listing-mappers'
import { ensureAdminProfile, requireAuthSession } from '../lib/auth'
import DocxUploader from '../components/DocxUploader'
import DocxEditor from '../components/DocxEditor'
import ConfirmModal from '../components/ConfirmModal'
import { exportToDocx } from '../lib/export-docx'
import { FileText, Plus, FileEdit, Trash2, Home, Download, Loader2 } from 'lucide-react'

type AuthUser = {
  email?: string
}

type SessionState = 'loading' | 'authenticated' | 'unauthenticated'
type ActiveTab = 'listings' | 'documents'

function makeId() {
  return crypto.randomUUID()
}

function listingFromFormValues(id: string, values: AdminListingSubmitPayload): Listing {
  return {
    id,
    title: values.title,
    description: values.description,
    type: values.type,
    address: values.address,
    city: values.city,
    area: values.area,
    price: values.price,
    rentFrequency: values.rentFrequency === '' ? null : (values.rentFrequency as Listing['rentFrequency']),
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    size: values.size,
    amenities: values.amenities ? values.amenities.split(',').map((item) => item.trim()).filter(Boolean) : [],
    status: values.status as ListingStatus,
    portalLinks: values.portalLinks,
    images: values.images,
  }
}

async function upsertListing(listing: Listing) {
  const { data: existingImages, error: existingImagesError } = await supabase
    .from('property_images')
    .select('storage_path')
    .eq('property_id', listing.id)

  if (existingImagesError) throw existingImagesError

  const propertyPayload = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    type: listing.type,
    address: listing.address,
    city: listing.city,
    area: listing.area,
    price: listing.price,
    rent_frequency: listing.rentFrequency,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    size: listing.size,
    amenities: listing.amenities,
    status: listing.status,
    portal_links: listing.portalLinks,
  }

  const { error: propertyError } = await supabase.from('properties').upsert(propertyPayload)
  if (propertyError) throw propertyError

  const { error: deleteImagesError } = await supabase.from('property_images').delete().eq('property_id', listing.id)
  if (deleteImagesError) throw deleteImagesError

  const removedStoragePaths = (existingImages ?? [])
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path))

  if (removedStoragePaths.length) {
    const { error: storageDeleteError } = await supabase.storage.from('property-images').remove(removedStoragePaths)
    if (storageDeleteError) throw storageDeleteError
  }

  if (listing.images.length > 0) {
    const imageRows = listing.images.map((image) => ({
      id: image.id,
      property_id: listing.id,
      url: image.url,
      storage_path: image.storagePath ?? null,
      sort_order: image.sortOrder,
      is_cover: image.isCover,
    }))
    const { error: insertImagesError } = await supabase.from('property_images').insert(imageRows)
    if (insertImagesError) throw insertImagesError
  }
}

type DeleteTarget =
  | { type: 'listing'; id: string; title: string }
  | { type: 'document'; id: string; title: string }

export default function AdminDashboard() {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState<Listing[]>([])
  const [editing, setEditing] = useState<Listing | null>(null)

  // Document state
  const [activeTab, setActiveTab] = useState<ActiveTab>('listings')
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [editingDoc, setEditingDoc] = useState<{ id?: string; propertyId: string; title: string; content: string } | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadTargetProperty, setUploadTargetProperty] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const queryClient = useQueryClient()

  const listingsQuery = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return []

      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id,title,description,type,address,city,area,price,rent_frequency,bedrooms,bathrooms,size,amenities,status,portal_links,bayut_url,external_url,created_at')
        .order('created_at', { ascending: false })

      if (propertiesError) throw propertiesError

      const propertyIds = (properties ?? []).map((property) => property.id)
      if (propertyIds.length === 0) return []

      const { data: images, error: imagesError } = await supabase
        .from('property_images')
        .select('id,property_id,url,storage_path,sort_order,is_cover')
        .in('property_id', propertyIds)
        .order('sort_order', { ascending: true })

      if (imagesError) throw imagesError

      const groupedImages = new Map<string, typeof images>()
      for (const image of images ?? []) {
        const current = groupedImages.get(image.property_id) ?? []
        current.push(image)
        groupedImages.set(image.property_id, current)
      }

      return (properties ?? []).map((property) => propertyRowToListing(property, groupedImages.get(property.id) ?? []))
    },
    enabled: sessionState === 'authenticated',
  })

  const documentsQuery = useQuery({
    queryKey: ['admin-documents'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return []
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return (data ?? []).map((doc: any) => ({
        id: doc.id,
        propertyId: doc.property_id,
        title: doc.title,
        content: doc.content,
        fileUrl: doc.file_url,
        storagePath: doc.storage_path,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      })) as PropertyDocument[]
    },
    enabled: sessionState === 'authenticated',
  })

  useEffect(() => {
    if (listingsQuery.data) setItems(listingsQuery.data)
  }, [listingsQuery.data])

  useEffect(() => {
    if (documentsQuery.data) setDocuments(documentsQuery.data)
  }, [documentsQuery.data])

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        setSessionState('unauthenticated')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await ensureAdminProfile(data.session.user.id, data.session.user.email)
        setUser({ email: data.session.user.email ?? undefined })
        setSessionState('authenticated')
      } else {
        setSessionState('unauthenticated')
      }
    }

    void load()

    if (!isSupabaseConfigured) return

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureAdminProfile(session.user.id, session.user.email)
        setUser({ email: session.user.email ?? undefined })
        setSessionState('authenticated')
      } else {
        setUser(null)
        setSessionState('unauthenticated')
      }
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const counts = useMemo(() => ({
    total: items.length,
    published: items.filter((item) => item.status === 'published').length,
    draft: items.filter((item) => item.status === 'draft').length,
    documents: documents.length,
  }), [items, documents])

  const login = async () => {
    setMessage(null)
    if (!isSupabaseConfigured) {
      setMessage('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before logging in.')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
      return
    }

    if (data.user) {
      await ensureAdminProfile(data.user.id, data.user.email)
    }

    setEmail('')
    setPassword('')
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const saveMutation = useMutation({
    mutationFn: async (listing: Listing) => {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
      await upsertListing(listing)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      setMessage('Listing saved.')
      setEditing(null)
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Save failed.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
      const { data: imageRows, error: imageRowsError } = await supabase
        .from('property_images')
        .select('storage_path')
        .eq('property_id', id)

      if (imageRowsError) throw imageRowsError

      const storagePaths = (imageRows ?? [])
        .map((row) => row.storage_path)
        .filter((path): path is string => Boolean(path))

      if (storagePaths.length) {
        const { error: storageDeleteError } = await supabase.storage.from('property-images').remove(storagePaths)
        if (storageDeleteError) throw storageDeleteError
      }

      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
      setMessage('Listing deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const saveDocMutation = useMutation({
    mutationFn: async (payload: { id?: string; propertyId: string; title: string; content: string }) => {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
      await requireAuthSession()

      if (!payload.propertyId) {
        throw new Error('Select a property before saving this document.')
      }

      const docId = payload.id ?? makeId()
      const payloadToSave = {
        id: docId,
        property_id: payload.propertyId,
        title: payload.title,
        content: payload.content,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('property_documents').upsert(payloadToSave)
      if (error) throw error
      return docId
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      setMessage('Document saved.')
      setEditingDoc(null)
      setUploadingDoc(false)
    },
    onError: (error: unknown) => {
      const pgError = error as { code?: string; message?: string }
      const message = pgError.message ?? 'Save failed.'

      if (message.includes('session expired')) {
        setSessionState('unauthenticated')
        setUser(null)
        setEditingDoc(null)
      }

      if (
        pgError.code === '42501'
        || message.toLowerCase().includes('row-level security')
        || message.toLowerCase().includes('permission denied')
      ) {
        setMessage('Save failed: not authorized. Sign out, sign in again, then run supabase/migrations/005_property_documents_complete.sql in Supabase if it still fails.')
        return
      }

      setMessage(message)
    },
  })

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
      const { error } = await supabase.from('property_documents').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      setMessage('Document deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const saveListing = async (payload: AdminListingSubmitPayload) => {
    setMessage(null)
    const id = editing?.id ?? makeId()
    const next = listingFromFormValues(id, payload)
    setItems((current) => [next, ...current.filter((item) => item.id !== id)])
    await saveMutation.mutateAsync(next)
    setEditing(null)
  }

  const deleteListing = (item: Listing) => {
    setDeleteTarget({ type: 'listing', id: item.id, title: item.title })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'listing') {
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id))
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

  const isDeletePending = deleteMutation.isPending || deleteDocMutation.isPending

  if (sessionState === 'loading') {
    return <div className="card">Loading admin session...</div>
  }

  if (sessionState === 'unauthenticated') {
    return (
      <div className="max-w-xl mx-auto space-y-6 mt-10">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-heading font-semibold text-primary">Admin Portal</h2>
          <p className="text-neutral-600">Secure entry for branch administration.</p>
        </div>
        <div className="card space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          <button type="button" className="btn-primary w-full" onClick={() => void login()}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  if (editingDoc) {
    return (
      <div className="space-y-4" style={{ height: 'calc(100vh - 180px)' }}>
        <DocxEditor
          initialContent={editingDoc.content}
          title={editingDoc.title}
          onTitleChange={(title) => setEditingDoc((prev) => prev ? { ...prev, title } : null)}
          onSave={(content) => {
            saveDocMutation.mutate({ ...editingDoc, content })
          }}
          onExport={(content) => {
            void exportToDocx(content, `${editingDoc.title || 'document'}.docx`)
          }}
          onCancel={() => setEditingDoc(null)}
        />
        {saveDocMutation.isPending && <p className="text-sm text-neutral-600">Saving document...</p>}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between border border-neutral-200">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-dark font-medium mb-1">Admin Panel</p>
          <h2 className="text-3xl font-heading font-semibold text-primary">
            {activeTab === 'listings' ? 'Property Listings' : 'Document Hub'}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">Signed in as {user?.email ?? 'admin'}.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'listings' ? 'bg-white shadow-sm text-primary' : 'text-neutral-600 hover:text-primary'}`}
            >
              <Home className="w-4 h-4" /> Properties
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'documents' ? 'bg-white shadow-sm text-primary' : 'text-neutral-600 hover:text-primary'}`}
            >
              <FileText className="w-4 h-4" /> Documents
            </button>
          </div>
          <button type="button" className="text-sm text-neutral-600 hover:text-danger hover:underline transition-colors px-1" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </section>

      {message ? <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">{message}</div> : null}

      {/* PROPERTIES TAB */}
      {activeTab === 'listings' && (
        <section className="grid gap-8 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700">Total: {counts.total}</div>
                <div className="rounded-lg bg-green-100/50 px-3 py-1.5 text-xs font-semibold text-success">Published: {counts.published}</div>
                <div className="rounded-lg bg-orange-100/50 px-3 py-1.5 text-xs font-semibold text-warning">Drafts: {counts.draft}</div>
              </div>
            </div>
            
            {items.length ? (
              items.map((item) => (
                <article key={item.id} className="card space-y-3 relative overflow-hidden group">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-primary group-hover:text-accent-dark transition-colors">{item.title}</h3>
                      <p className="text-sm text-neutral-600">{item.city} {item.area ? `· ${item.area}` : ''}</p>
                    </div>
                    <span className={item.status === 'published' ? 'badge-success' : 'badge-warning'}>{item.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-neutral-500 uppercase tracking-widest mt-2">
                    <span className="bg-neutral-100 px-2 py-1 rounded">{item.type}</span>
                    <span className="bg-neutral-100 px-2 py-1 rounded">{item.bedrooms} bed</span>
                    <span className="bg-neutral-100 px-2 py-1 rounded">{item.bathrooms} bath</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100 mt-2">
                    <button type="button" className="btn-primary py-1.5 px-3 text-xs" onClick={() => setEditing(item)}>
                      Edit Property
                    </button>
                    <button type="button" className="py-1.5 px-3 text-xs font-medium rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100" onClick={() => {
                       setActiveTab('documents')
                       setUploadTargetProperty(item.id)
                       setUploadingDoc(true)
                    }}>
                      <Plus className="w-3 h-3 inline-block mr-1" /> Add Document
                    </button>
                    <button type="button" className="py-1.5 px-3 text-xs font-medium rounded-md border border-danger/30 text-danger hover:bg-danger/5 ml-auto" onClick={() => deleteListing(item)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="card text-center py-12 text-neutral-500">No properties yet. Create the first listing on the right.</div>
            )}
          </div>

          <div className="card self-start sticky top-24">
            <h3 className="mb-4 text-xl font-semibold text-primary">{editing ? 'Edit Listing' : 'Create Listing'}</h3>
            <AdminListingForm
              value={editing}
              onSubmit={(payload) => { void saveListing(payload) }}
              onCancel={() => setEditing(null)}
            />
            {saveMutation.isPending && <p className="mt-4 text-sm text-neutral-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving changes...</p>}
          </div>
        </section>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
             <div>
                <h3 className="font-semibold text-lg text-primary">All Documents</h3>
                <p className="text-sm text-neutral-600">{counts.documents} files stored securely.</p>
             </div>
             <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setUploadingDoc(!uploadingDoc)}
             >
                {uploadingDoc ? 'Cancel Upload' : <><Plus className="w-4 h-4" /> New Document</>}
             </button>
          </div>

          {uploadingDoc && (
             <div className="grid gap-6 md:grid-cols-2">
                <div className="card">
                   <h4 className="font-semibold mb-4 text-lg">Upload Existing DOCX</h4>
                   <DocxUploader
                     onParsed={(title, html) => {
                        setEditingDoc({ propertyId: uploadTargetProperty || (items[0]?.id || ''), title, content: html })
                     }}
                   />
                </div>
                <div className="card flex flex-col justify-center items-center text-center p-8 bg-neutral-50 border-dashed">
                   <FileEdit className="w-12 h-12 text-neutral-400 mb-4" />
                   <h4 className="font-semibold mb-2 text-lg text-primary">Create Blank Document</h4>
                   <p className="text-sm text-neutral-600 mb-6 px-4">Start typing from scratch utilizing our rich-text builder to draft contracts or brochures.</p>
                   {items.length === 0 ? (
                     <p className="text-sm text-danger font-medium">Please construct a property listing first.</p>
                   ) : (
                     <div className="w-full max-w-xs space-y-3 text-left">
                        <label className="block text-sm font-medium">Link to Property:</label>
                        <select 
                           className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                           value={uploadTargetProperty}
                           onChange={e => setUploadTargetProperty(e.target.value)}
                        >
                           <option value="">-- Select a property --</option>
                           {items.map(item => (
                             <option key={item.id} value={item.id}>{item.title}</option>
                           ))}
                        </select>
                        <button
                           className="btn-primary w-full justify-center"
                           disabled={!uploadTargetProperty && !items[0]?.id}
                           onClick={() => {
                              setEditingDoc({
                                propertyId: uploadTargetProperty || items[0].id,
                                title: 'Untitled Document',
                                content: '<h1>New Document</h1><p>Start typing here...</p>'
                              })
                           }}
                        >
                           Open Editor
                        </button>
                     </div>
                   )}
                </div>
             </div>
          )}

          {!uploadingDoc && (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {documents.length > 0 ? (
                  documents.map(doc => {
                     const linkedProperty = items.find(i => i.id === doc.propertyId)
                     return (
                        <div key={doc.id} className="card group flex flex-col h-full hover:-translate-y-1 transition-transform">
                           <div className="flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-neutral-400">
                                   {new Date(doc.updatedAt || doc.createdAt || '').toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-semibold text-lg text-primary line-clamp-2 leading-tight mb-2">{doc.title}</h4>
                              <p className="text-xs text-neutral-600 font-medium bg-neutral-100 inline-block px-2 py-1 rounded truncate max-w-full">
                               Link: {linkedProperty?.title || 'Unknown Property'}
                              </p>
                           </div>
                           <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingDoc(doc)}
                                className="text-sm font-medium text-primary hover:text-accent-dark flex items-center gap-1"
                              >
                                <FileEdit className="w-4 h-4" /> Edit
                              </button>
                               <button 
                                onClick={() => {
                                  void exportToDocx(doc.content, `${doc.title}.docx`)
                                }}
                                className="text-sm font-medium text-neutral-600 hover:text-primary flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" /> Export
                              </button>
                              <button 
                                onClick={() => setDeleteTarget({ type: 'document', id: doc.id, title: doc.title })}
                                className="text-sm font-medium text-danger hover:text-danger-dark p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     )
                  })
               ) : (
                 <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-xl border border-dashed border-neutral-300">
                    <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-primary">No Documents Found</h3>
                    <p className="text-neutral-500 mt-1 max-w-md mx-auto mb-6">Upload DOCX contracts, brochures, or notes, and link them directly to your real estate listings.</p>
                    <button className="btn-primary" onClick={() => setUploadingDoc(true)}>Upload First Document</button>
                 </div>
               )}
             </div>
          )}
        </section>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteTarget?.type === 'listing' ? 'Delete listing?' : 'Delete document?'}
        description={deleteModalDescription}
        confirmLabel="Delete"
        loading={isDeletePending}
        onCancel={() => {
          if (!isDeletePending) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

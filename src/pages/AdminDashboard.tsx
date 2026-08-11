import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Listing, ListingImage, ListingStatus } from '../types/listing'
import AdminListingForm, { type AdminListingFormValues } from '../components/AdminListingForm'
import { propertyRowToListing } from '../lib/listing-mappers'

type AuthUser = {
  email?: string
}

type SessionState = 'loading' | 'authenticated' | 'unauthenticated'

function makeId() {
  return crypto.randomUUID()
}

function listingFromFormValues(id: string, values: AdminListingFormValues, images: ListingImage[]): Listing {
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
    portalLinks: (values.portalLinks ?? []).filter((link) => link.url.trim()),
    images,
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

export default function AdminDashboard() {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState<Listing[]>([])
  const [editing, setEditing] = useState<Listing | null>(null)
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

  useEffect(() => {
    if (listingsQuery.data) {
      setItems(listingsQuery.data)
    }
  }, [listingsQuery.data])

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        setSessionState('unauthenticated')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setUser({ email: data.session.user.email ?? undefined })
        setSessionState('authenticated')
      } else {
        setSessionState('unauthenticated')
      }
    }

    void load()

    if (!isSupabaseConfigured) return

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
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
  }), [items])

  const login = async () => {
    setMessage(null)
    if (!isSupabaseConfigured) {
      setMessage('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before logging in.')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
      return
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
      setMessage('Saved to Supabase.')
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
      setMessage('Deleted from Supabase.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const saveListing = async (payload: AdminListingFormValues & { images: ListingImage[] }) => {
    setMessage(null)

    const id = editing?.id ?? makeId()
    const next = listingFromFormValues(id, payload, payload.images)

    setItems((current) => [next, ...current.filter((item) => item.id !== id)])
    await saveMutation.mutateAsync(next)
    setEditing(null)
  }

  const deleteListing = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    void deleteMutation.mutateAsync(id)
  }

  if (sessionState === 'loading') {
    return <div className="card">Loading admin session...</div>
  }

  if (sessionState === 'unauthenticated') {
    return (
      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Admin login</h2>
          <p className="text-neutral-600">Email/password login for the single admin role.</p>
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
          <button type="button" className="btn-primary" onClick={() => void login()}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent-dark">Admin panel</p>
          <h2 className="text-3xl font-heading font-semibold">Property listings</h2>
          <p className="text-neutral-600">Signed in as {user?.email ?? 'admin'}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg bg-neutral-100 px-4 py-2 text-sm">Total: {counts.total}</div>
          <div className="rounded-lg bg-neutral-100 px-4 py-2 text-sm">Published: {counts.published}</div>
          <div className="rounded-lg bg-neutral-100 px-4 py-2 text-sm">Drafts: {counts.draft}</div>
          <button type="button" className="rounded-md border border-neutral-200 px-4 py-2" onClick={() => setEditing(null)}>
            New listing
          </button>
          <button type="button" className="rounded-md border border-neutral-200 px-4 py-2" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </section>

      {message ? <div className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-600">{message}</div> : null}

      <section className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <article key={item.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="text-sm text-neutral-600">{item.city} · {item.area}</p>
                  </div>
                  <span className={item.status === 'published' ? 'badge-success' : 'badge-warning'}>{item.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
                  <span>{item.type}</span>
                  <span>{item.bedrooms} bed</span>
                  <span>{item.bathrooms} bath</span>
                  <span>{item.size} sqft</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="rounded-md border border-neutral-200 px-4 py-2" onClick={() => setEditing(item)}>
                    Edit
                  </button>
                  <button type="button" className="rounded-md border border-danger px-4 py-2 text-danger" onClick={() => deleteListing(item.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="card text-neutral-600">No listings yet. Create the first property on the right.</div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit listing' : 'Create listing'}</h3>
          <AdminListingForm
            value={editing}
            onSubmit={(payload) => {
              void saveListing(payload)
            }}
            onCancel={() => setEditing(null)}
          />
          {saveMutation.isPending ? <p className="mt-3 text-sm text-neutral-600">Saving...</p> : null}
        </div>
      </section>
    </div>
  )
}

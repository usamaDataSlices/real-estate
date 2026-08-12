import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import BookingsCalendar from '../components/bookings/BookingsCalendar'
import BookingSidePanel from '../components/bookings/BookingSidePanel'
import { requireAuthSession } from '../lib/auth'
import { bookingRowToBooking, bookingToRow } from '../lib/booking-mappers'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Booking, BookingFormValues } from '../types/booking'

type PanelState =
  | { open: false }
  | { open: true; mode: 'create'; values: BookingFormValues }
  | { open: true; mode: 'edit'; bookingId: string; values: BookingFormValues }

function makeId() {
  return crypto.randomUUID()
}

function bookingToFormValues(booking: Booking): BookingFormValues {
  return {
    propertyId: booking.propertyId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone ?? '',
    price: booking.price,
    status: booking.status,
    notes: booking.notes ?? '',
  }
}

export default function BookingsPage() {
  const queryClient = useQueryClient()
  const [propertySearch, setPropertySearch] = useState('')
  const [panel, setPanel] = useState<PanelState>({ open: false })
  const [message, setMessage] = useState<string | null>(null)

  const propertiesQuery = useQuery({
    queryKey: ['bookings-properties'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('properties')
        .select('id,title,city,area,status')
        .order('title', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('bookings')
        .select('id,property_id,check_in,check_out,guest_name,guest_phone,price,status,notes')
        .order('check_in', { ascending: true })

      if (error) throw error
      return (data ?? []).map(bookingRowToBooking)
    },
  })

  const properties = propertiesQuery.data ?? []
  const bookings = bookingsQuery.data ?? []

  const visibleProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase()
    if (!query) return properties

    return properties.filter(
      (property) =>
        property.title.toLowerCase().includes(query)
        || (property.city ?? '').toLowerCase().includes(query)
        || (property.area ?? '').toLowerCase().includes(query),
    )
  }, [properties, propertySearch])

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; values: BookingFormValues }) => {
      await requireAuthSession()
      const row = bookingToRow({ id: payload.id, ...payload.values })
      const { error } = await supabase.from('bookings').upsert(row)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setPanel({ open: false })
      setMessage('Booking saved.')
    },
    onError: (error: unknown) => {
      const pgError = error as { message?: string }
      setMessage(pgError.message ?? 'Failed to save booking.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await requireAuthSession()
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setPanel({ open: false })
      setMessage('Booking deleted.')
    },
    onError: (error: unknown) => {
      const pgError = error as { message?: string }
      setMessage(pgError.message ?? 'Failed to delete booking.')
    },
  })

  const openCreatePanel = (payload: { propertyId: string; checkIn: string; checkOut: string }) => {
    setMessage(null)
    setPanel({
      open: true,
      mode: 'create',
      values: {
        propertyId: payload.propertyId,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        guestName: '',
        guestPhone: '',
        price: 0,
        status: 'pending',
        notes: '',
      },
    })
  }

  const openEditPanel = (booking: Booking) => {
    setMessage(null)
    setPanel({
      open: true,
      mode: 'edit',
      bookingId: booking.id,
      values: bookingToFormValues(booking),
    })
  }

  const handleSave = (values: BookingFormValues) => {
    if (panel.open && panel.mode === 'edit') {
      saveMutation.mutate({ id: panel.bookingId, values })
      return
    }
    saveMutation.mutate({ id: makeId(), values })
  }

  const handleDelete = () => {
    if (panel.open && panel.mode === 'edit') {
      deleteMutation.mutate(panel.bookingId)
    }
  }

  const isLoading = propertiesQuery.isLoading || bookingsQuery.isLoading
  const loadError = propertiesQuery.error || bookingsQuery.error

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-dark">Operations</p>
        <h1 className="text-3xl font-heading font-semibold text-primary">Bookings</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Manage reservations across your portfolio. Drag on a property row to create a booking, or click an existing bar to edit.
        </p>
      </section>

      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
      ) : null}

      {loadError ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-danger">
          Failed to load bookings data. Run <code className="text-sm">supabase/migrations/006_bookings.sql</code> and sign in as admin.
        </div>
      ) : isLoading ? (
        <div className="card text-neutral-600">Loading bookings calendar...</div>
      ) : (
        <BookingsCalendar
          properties={visibleProperties.map((property) => ({
            id: property.id,
            title: property.title,
          }))}
          propertySearch={propertySearch}
          onPropertySearchChange={setPropertySearch}
          bookings={bookings}
          onSelectRange={openCreatePanel}
          onEditBooking={openEditPanel}
        />
      )}

      <BookingSidePanel
        open={panel.open}
        mode={panel.open ? panel.mode : 'create'}
        properties={properties.map((property) => ({ id: property.id, title: property.title }))}
        initialValues={panel.open ? panel.values : {
          propertyId: '',
          checkIn: '',
          checkOut: '',
          guestName: '',
          guestPhone: '',
          price: 0,
          status: 'pending',
          notes: '',
        }}
        saving={saveMutation.isPending}
        deleting={deleteMutation.isPending}
        onClose={() => {
          if (!saveMutation.isPending && !deleteMutation.isPending) {
            setPanel({ open: false })
          }
        }}
        onSave={handleSave}
        onDelete={panel.open && panel.mode === 'edit' ? handleDelete : undefined}
      />
    </div>
  )
}

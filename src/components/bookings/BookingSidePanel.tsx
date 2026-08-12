import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import type { BookingFormValues, BookingStatus } from '../../types/booking'

const bookingSchema = z
  .object({
    propertyId: z.string().min(1, 'Property is required'),
    checkIn: z.string().min(1, 'Check-in is required'),
    checkOut: z.string().min(1, 'Check-out is required'),
    guestName: z.string().min(2, 'Guest name is required'),
    guestPhone: z.string().optional(),
    price: z.coerce.number().nonnegative(),
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
    notes: z.string().optional(),
  })
  .refine((values) => values.checkOut >= values.checkIn, {
    message: 'Check-out must be on or after check-in',
    path: ['checkOut'],
  })

type PropertyOption = {
  id: string
  title: string
}

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  properties: PropertyOption[]
  initialValues: BookingFormValues
  saving?: boolean
  deleting?: boolean
  onClose: () => void
  onSave: (values: BookingFormValues) => void
  onDelete?: () => void
}

const emptyValues: BookingFormValues = {
  propertyId: '',
  checkIn: '',
  checkOut: '',
  guestName: '',
  guestPhone: '',
  price: 0,
  status: 'pending',
  notes: '',
}

export default function BookingSidePanel({
  open,
  mode,
  properties,
  initialValues,
  saving = false,
  deleting = false,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [form, initialValues, open])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close booking panel"
        className="fixed inset-0 z-40 bg-neutral-900/30 backdrop-blur-[1px]"
        onClick={saving || deleting ? undefined : onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent-dark">
              {mode === 'create' ? 'New booking' : 'Edit booking'}
            </p>
            <h2 className="text-xl font-semibold text-primary">Booking details</h2>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
            onClick={onClose}
            disabled={saving || deleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={form.handleSubmit((values) => onSave(values))}
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Property</span>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('propertyId')}>
                <option value="">Select property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Check-in</span>
                <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('checkIn')} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Check-out</span>
                <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('checkOut')} />
                <p className="text-xs text-danger">{form.formState.errors.checkOut?.message}</p>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Guest name</span>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('guestName')} />
              <p className="text-xs text-danger">{form.formState.errors.guestName?.message}</p>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Phone</span>
              <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('guestPhone')} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Price (AED)</span>
                <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('price')} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Status</span>
                <select className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('status')}>
                  {(['pending', 'confirmed', 'cancelled', 'completed'] as BookingStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Notes</span>
              <textarea rows={4} className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('notes')} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 p-5">
            {mode === 'edit' && onDelete ? (
              <button
                type="button"
                className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
                onClick={onDelete}
                disabled={saving || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            ) : null}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving || deleting}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </>
  )
}

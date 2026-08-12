import type { Booking, BookingFormValues, BookingStatus } from '../types/booking'

type BookingRow = {
  id: string
  property_id: string
  check_in: string
  check_out: string
  guest_name: string
  guest_phone: string | null
  price: number | null
  status: string | null
  notes: string | null
}

const bookingStatuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed']

function normalizeStatus(value: string | null): BookingStatus {
  if (value && bookingStatuses.includes(value as BookingStatus)) {
    return value as BookingStatus
  }
  return 'pending'
}

export function bookingRowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    propertyId: row.property_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    price: row.price ?? 0,
    status: normalizeStatus(row.status),
    notes: row.notes,
  }
}

export function bookingToRow(booking: Booking | (BookingFormValues & { id?: string })) {
  return {
    ...(booking.id ? { id: booking.id } : {}),
    property_id: booking.propertyId,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    guest_name: booking.guestName,
    guest_phone: booking.guestPhone || null,
    price: booking.price,
    status: booking.status,
    notes: booking.notes || null,
    updated_at: new Date().toISOString(),
  }
}

/** FullCalendar all-day end is exclusive; add one day so checkout date is included. */
export function bookingToCalendarEnd(checkOut: string) {
  const date = new Date(`${checkOut}T00:00:00`)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type Booking = {
  id: string
  propertyId: string
  checkIn: string
  checkOut: string
  guestName: string
  guestPhone?: string | null
  price: number
  status: BookingStatus
  notes?: string | null
}

export type BookingFormValues = {
  propertyId: string
  checkIn: string
  checkOut: string
  guestName: string
  guestPhone: string
  price: number
  status: BookingStatus
  notes: string
}

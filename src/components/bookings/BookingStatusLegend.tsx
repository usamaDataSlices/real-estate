import { Info } from 'lucide-react'
import type { BookingStatus } from '../../types/booking'

const STATUS_ITEMS: { status: BookingStatus; label: string; hint: string }[] = [
  { status: 'pending', label: 'Pending', hint: 'Awaiting confirmation' },
  { status: 'confirmed', label: 'Confirmed', hint: 'Guest is booked' },
  { status: 'completed', label: 'Completed', hint: 'Stay finished' },
  { status: 'cancelled', label: 'Cancelled', hint: 'No longer active' },
]

export default function BookingStatusLegend() {
  return (
    <div className="booking-status-legend border-b border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Booking colors</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {STATUS_ITEMS.map((item) => (
              <div key={item.status} className="flex items-center gap-2" title={item.hint}>
                <span className={`booking-legend-swatch booking-legend-${item.status}`} aria-hidden />
                <span className="text-sm text-neutral-800">
                  <span className="font-semibold">{item.label}</span>
                  <span className="hidden text-neutral-500 sm:inline"> — {item.hint}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs leading-5 text-neutral-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-dark" aria-hidden />
          <p>
            <span className="font-semibold text-neutral-800">Tip:</span> drag across dates on a property row to create a booking, or click a colored bar to edit.
          </p>
        </div>
      </div>
    </div>
  )
}

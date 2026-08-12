import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type Props = {
  open: boolean
  value: Date
  onClose: () => void
  onSelect: (date: Date) => void
}

export default function CalendarMonthYearPicker({ open, value, onClose, onSelect }: Props) {
  const [year, setYear] = useState(value.getFullYear())
  const [month, setMonth] = useState(value.getMonth())

  useEffect(() => {
    if (!open) return
    setYear(value.getFullYear())
    setMonth(value.getMonth())
  }, [open, value])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const apply = () => {
    onSelect(new Date(year, month, 1))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]">
      <button
        type="button"
        aria-label="Close month picker"
        className="absolute inset-0 bg-neutral-900/25 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="month-year-picker-title"
        className="relative w-full max-w-xs rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="month-year-picker-title" className="text-sm font-semibold text-primary">
            Jump to month
          </h2>
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">
          <button
            type="button"
            className="rounded-md p-2 text-neutral-600 hover:bg-white"
            onClick={() => setYear((current) => current - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-lg font-heading font-semibold text-primary">{year}</span>
          <button
            type="button"
            className="rounded-md p-2 text-neutral-600 hover:bg-white"
            onClick={() => setYear((current) => current + 1)}
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((label, index) => {
            const isSelected = month === index
            const isCurrent =
              value.getFullYear() === year && value.getMonth() === index

            return (
              <button
                key={label}
                type="button"
                className={[
                  'rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : isCurrent
                      ? 'border border-accent bg-accent/10 text-primary'
                      : 'border border-neutral-200 text-neutral-700 hover:border-accent-light hover:bg-neutral-50',
                ].join(' ')}
                onClick={() => setMonth(index)}
              >
                {label.slice(0, 3)}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={apply}>
            Go
          </button>
        </div>
      </div>
    </div>
  )
}

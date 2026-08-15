import { useEffect } from 'react'
import { Loader2, Ticket, X } from 'lucide-react'
import TicketFormFields from './TicketFormFields'
import type { TicketFormValues } from '../../types/ticket'

type Props = {
  open: boolean
  values: TicketFormValues
  saving?: boolean
  onChange: (patch: Partial<TicketFormValues>) => void
  onSave: () => void
  onCancel: () => void
}

export default function TicketCreateModal({ open, values, saving = false, onChange, onSave, onCancel }: Props) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, saving, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-neutral-900/45 backdrop-blur-[1px]"
        onClick={saving ? undefined : onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-create-modal-title"
        className="relative flex max-h-[min(90dvh,720px)] w-full max-w-xl flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <h2 id="ticket-create-modal-title" className="text-base font-semibold text-neutral-900">
                Create ticket
              </h2>
              <p className="text-xs text-neutral-500">Track tasks, bugs, and work items.</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <TicketFormFields idPrefix="create-ticket" values={values} onChange={onChange} />
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
            onClick={onSave}
            disabled={saving || !values.title.trim()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

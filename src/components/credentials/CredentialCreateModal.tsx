import { useEffect } from 'react'
import { KeyRound, Loader2, X } from 'lucide-react'
import CredentialFormFields from './CredentialFormFields'
import type { CredentialFormValues } from '../../types/credential'

type Props = {
  open: boolean
  values: CredentialFormValues
  showPassword: boolean
  saving?: boolean
  onShowPasswordChange: (show: boolean) => void
  onChange: (patch: Partial<CredentialFormValues>) => void
  onSave: () => void
  onCancel: () => void
}

export default function CredentialCreateModal({
  open,
  values,
  showPassword,
  saving = false,
  onShowPasswordChange,
  onChange,
  onSave,
  onCancel,
}: Props) {
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
        aria-labelledby="credential-create-modal-title"
        className="relative flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col rounded-2xl border border-neutral-200 bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 id="credential-create-modal-title" className="text-lg font-semibold text-neutral-900">
                New credential
              </h2>
              <p className="mt-0.5 text-sm text-neutral-600">Save a portal login or secure access detail.</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <CredentialFormFields
            idPrefix="create-credential"
            values={values}
            showPassword={showPassword}
            onShowPasswordChange={onShowPasswordChange}
            onChange={onChange}
          />
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-neutral-200 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
            onClick={onSave}
            disabled={saving || !values.title.trim()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save credential
          </button>
        </div>
      </div>
    </div>
  )
}

import { Eye, EyeOff } from 'lucide-react'
import type { CredentialFormValues } from '../../types/credential'

type Props = {
  values: CredentialFormValues
  showPassword: boolean
  onShowPasswordChange: (show: boolean) => void
  onChange: (patch: Partial<CredentialFormValues>) => void
  idPrefix?: string
}

export default function CredentialFormFields({
  values,
  showPassword,
  onShowPasswordChange,
  onChange,
  idPrefix = 'credential',
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={`${idPrefix}-title`}>
          Title
        </label>
        <input
          id={`${idPrefix}-title`}
          type="text"
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="e.g. Zillow admin, Bank portal"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={`${idPrefix}-username`}>
          Username / email
        </label>
        <input
          id={`${idPrefix}-username`}
          type="text"
          value={values.username}
          onChange={(event) => onChange({ username: event.target.value })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={`${idPrefix}-password`}>
          Password
        </label>
        <div className="relative">
          <input
            id={`${idPrefix}-password`}
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={(event) => onChange({ password: event.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:bg-neutral-100"
            onClick={() => onShowPasswordChange(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={`${idPrefix}-url`}>
          URL
        </label>
        <input
          id={`${idPrefix}-url`}
          type="url"
          value={values.url}
          onChange={(event) => onChange({ url: event.target.value })}
          placeholder="https://"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor={`${idPrefix}-notes`}>
          Notes
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          value={values.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          rows={4}
          placeholder="Security questions, 2FA backup codes, etc."
          className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )
}

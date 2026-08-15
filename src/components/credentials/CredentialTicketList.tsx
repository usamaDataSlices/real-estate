import { KeyRound } from 'lucide-react'
import { escapeRegExp } from '../../lib/credential-search'
import type { Credential } from '../../types/credential'

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  const activeTerms = terms.map((term) => term.trim()).filter(Boolean)
  if (!activeTerms.length) return <>{text}</>

  const pattern = activeTerms.map(escapeRegExp).join('|')
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        activeTerms.some((term) => part.toLowerCase() === term.toLowerCase()) ? (
          <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  )
}

function credentialKey(id: string) {
  return `CRE-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

type Props = {
  credentials: Credential[]
  selectedId: string | null
  highlightTerms: string[]
  onSelect: (id: string) => void
}

export default function CredentialTicketList({
  credentials,
  selectedId,
  highlightTerms,
  onSelect,
}: Props) {
  return (
    <ul className="divide-y divide-neutral-200">
      {credentials.map((credential) => {
        const isSelected = credential.id === selectedId
        const key = credentialKey(credential.id)
        const subtitle = credential.username || hostFromUrl(credential.url) || 'No login set'
        const updatedLabel = formatRelativeTime(credential.updatedAt || credential.createdAt)

        return (
          <li key={credential.id}>
            <button
              type="button"
              onClick={() => onSelect(credential.id)}
              className={`group relative flex w-full gap-3 px-3 py-2.5 text-left transition-colors ${
                isSelected
                  ? 'border-l-[3px] border-l-primary bg-primary/[0.07] pl-[calc(0.75rem-3px)]'
                  : 'border-l-[3px] border-l-transparent hover:bg-neutral-50'
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  isSelected ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
                }`}
              >
                <KeyRound className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-neutral-500">{key}</span>
                  <span className="shrink-0 text-[11px] text-neutral-400">{updatedLabel}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">
                  <HighlightedText text={credential.title} terms={highlightTerms} />
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  <HighlightedText text={subtitle} terms={highlightTerms} />
                  {credential.url && credential.username ? (
                    <>
                      <span className="mx-1 text-neutral-300">·</span>
                      <HighlightedText text={hostFromUrl(credential.url)} terms={highlightTerms} />
                    </>
                  ) : null}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export { credentialKey, formatRelativeTime }

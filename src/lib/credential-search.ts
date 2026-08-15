import type { Credential } from '../types/credential'

export type ParsedCredentialSearch = {
  query: string
  exact: boolean
}

export function parseCredentialSearch(raw: string): ParsedCredentialSearch {
  const trimmed = raw.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
    return { query: trimmed.slice(1, -1), exact: true }
  }
  return { query: trimmed, exact: false }
}

export function credentialMatchesSearch(credential: Credential, parsed: ParsedCredentialSearch): boolean {
  const { query, exact } = parsed
  if (!query) return true

  const haystack = [credential.title, credential.username, credential.url, credential.notes]
    .join('\n')
    .toLowerCase()

  const needle = query.toLowerCase()

  if (exact) return haystack.includes(needle)

  return needle.split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

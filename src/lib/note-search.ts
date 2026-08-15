import type { Note } from '../types/note'

export type ParsedNoteSearch = {
  query: string
  exact: boolean
}

export function parseNoteSearch(raw: string): ParsedNoteSearch {
  const trimmed = raw.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
    return { query: trimmed.slice(1, -1), exact: true }
  }
  return { query: trimmed, exact: false }
}

export function noteMatchesSearch(note: Note, parsed: ParsedNoteSearch): boolean {
  const { query, exact } = parsed
  if (!query) return true

  const title = note.title.toLowerCase()
  const body = note.contentPlain.toLowerCase()
  const haystack = `${title}\n${body}`
  const needle = query.toLowerCase()

  if (exact) {
    return title.includes(needle) || body.includes(needle)
  }

  const words = needle.split(/\s+/).filter(Boolean)
  return words.every((word) => haystack.includes(word))
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

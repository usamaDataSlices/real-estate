import type { Ticket, TicketStatus } from '../types/ticket'

export type ParsedTicketSearch = {
  query: string
  exact: boolean
}

export function parseTicketSearch(raw: string): ParsedTicketSearch {
  const trimmed = raw.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
    return { query: trimmed.slice(1, -1), exact: true }
  }
  return { query: trimmed, exact: false }
}

export function ticketMatchesSearch(ticket: Ticket, parsed: ParsedTicketSearch): boolean {
  const { query, exact } = parsed
  if (!query) return true

  const haystack = [
    ticket.title,
    ticket.description,
    ticket.assignee,
    ticket.labels.join(' '),
    ticket.status,
    ticket.priority,
    ticket.type,
  ]
    .join('\n')
    .toLowerCase()

  const needle = query.toLowerCase()

  if (exact) return haystack.includes(needle)

  return needle.split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))
}

export function ticketMatchesStatus(ticket: Ticket, statusFilter: TicketStatus | 'all'): boolean {
  if (statusFilter === 'all') return true
  return ticket.status === statusFilter
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

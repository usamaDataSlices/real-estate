import type { TicketPriority, TicketStatus, TicketType } from '../../types/ticket'

export function ticketKey(id: string) {
  return `TKT-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

export function formatRelativeTime(value?: string) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const STATUS_STYLES: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  todo: { label: 'To Do', bg: 'bg-neutral-100', text: 'text-neutral-600' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700' },
  review: { label: 'Review', bg: 'bg-purple-100', text: 'text-purple-700' },
  done: { label: 'Done', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-neutral-200', text: 'text-neutral-500' },
}

export const PRIORITY_STYLES: Record<TicketPriority, { label: string; color: string }> = {
  lowest: { label: 'Lowest', color: 'text-neutral-400' },
  low: { label: 'Low', color: 'text-blue-400' },
  medium: { label: 'Medium', color: 'text-amber-500' },
  high: { label: 'High', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
}

export const TYPE_LABELS: Record<TicketType, string> = {
  task: 'Task',
  bug: 'Bug',
  story: 'Story',
  improvement: 'Improvement',
}

export function parseLabelsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
}

export function labelsToInput(labels: string[]): string {
  return labels.join(', ')
}

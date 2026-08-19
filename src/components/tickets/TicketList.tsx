import { AlertCircle, ArrowDown, ArrowUp, BookOpen, CheckSquare, Lightbulb, Minus } from 'lucide-react'
import { escapeRegExp } from '../../lib/ticket-search'
import type { Ticket, TicketPriority, TicketType } from '../../types/ticket'
import { formatRelativeTime, PRIORITY_STYLES, STATUS_STYLES, ticketKey, TYPE_LABELS } from './ticket-display'

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

function TypeIcon({ type, className }: { type: TicketType; className?: string }) {
  const props = { className: className ?? 'h-3.5 w-3.5' }
  switch (type) {
    case 'bug':
      return <AlertCircle {...props} />
    case 'story':
      return <BookOpen {...props} />
    case 'improvement':
      return <Lightbulb {...props} />
    default:
      return <CheckSquare {...props} />
  }
}

function PriorityIcon({ priority }: { priority: TicketPriority }) {
  const color = PRIORITY_STYLES[priority].color
  switch (priority) {
    case 'lowest':
      return <ArrowDown className={`h-3 w-3 ${color}`} />
    case 'low':
      return <ArrowDown className={`h-3 w-3 ${color}`} />
    case 'high':
      return <ArrowUp className={`h-3 w-3 ${color}`} />
    case 'urgent':
      return <ArrowUp className={`h-3 w-3 ${color}`} />
    default:
      return <Minus className={`h-3 w-3 ${color}`} />
  }
}

type Props = {
  tickets: Ticket[]
  selectedId: string | null
  highlightTerms: string[]
  onSelect: (id: string) => void
}

export default function TicketList({
  tickets,
  selectedId,
  highlightTerms,
  onSelect,
}: Props) {
  return (
    <ul className="divide-y divide-neutral-100">
      {tickets.map((ticket) => {
        const isSelected = ticket.id === selectedId
        const key = ticketKey(ticket.id)
        const statusStyle = STATUS_STYLES[ticket.status]
        const updatedLabel = formatRelativeTime(ticket.updatedAt || ticket.createdAt)

        return (
          <li key={ticket.id}>
            <button
              type="button"
              onClick={() => onSelect(ticket.id)}
              className={`group flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition-colors ${
                isSelected
                  ? 'border-l-[3px] border-l-primary bg-primary/[0.06] pl-[calc(0.625rem-3px)]'
                  : 'border-l-[3px] border-l-transparent hover:bg-neutral-50'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-neutral-400">
                <TypeIcon type={ticket.type} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 font-mono text-[10px] font-semibold text-neutral-400">{key}</span>
                  <span
                    className={`shrink-0 rounded px-1 py-px text-[10px] font-medium leading-tight ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </span>
                  <PriorityIcon priority={ticket.priority} />
                  <span className="ml-auto shrink-0 text-[10px] text-neutral-400">{updatedLabel}</span>
                </div>

                <p className="mt-0.5 line-clamp-1 text-[13px] font-medium leading-snug text-neutral-900">
                  <HighlightedText text={ticket.title} terms={highlightTerms} />
                </p>

                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <span>{TYPE_LABELS[ticket.type]}</span>
                  {ticket.assignee ? (
                    <>
                      <span className="text-neutral-300">·</span>
                      <span className="truncate">
                        <HighlightedText text={ticket.assignee} terms={highlightTerms} />
                      </span>
                    </>
                  ) : null}
                  {(ticket.attachmentCount ?? 0) > 0 ? (
                    <>
                      <span className="text-neutral-300">·</span>
                      <span>{ticket.attachmentCount} file{(ticket.attachmentCount ?? 0) === 1 ? '' : 's'}</span>
                    </>
                  ) : null}
                  {ticket.labels.length > 0 ? (
                    <>
                      <span className="text-neutral-300">·</span>
                      <span className="truncate">{ticket.labels.slice(0, 2).join(', ')}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export { ticketKey, formatRelativeTime }

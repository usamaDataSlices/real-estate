import { useEffect, useState } from 'react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import TicketAttachmentsList from './TicketAttachmentsList'
import TicketFormFields from './TicketFormFields'
import { labelsToInput, parseLabelsInput, PRIORITY_STYLES, STATUS_STYLES, ticketKey, TYPE_LABELS } from './ticket-display'
import { fetchTicketAttachments } from '../../lib/tickets-api'
import type { Ticket, TicketFormValues } from '../../types/ticket'
import { TICKET_PRIORITIES, TICKET_STATUSES, TICKET_TYPES } from '../../types/ticket'

type Props = {
  ticket: Ticket
  userId: string | null
  editing: boolean
  saving?: boolean
  editValues: TicketFormValues
  onStartEdit: () => void
  onCancelEdit: () => void
  onEditChange: (patch: Partial<TicketFormValues>) => void
  onSave: () => void
  onQuickUpdate: (patch: Partial<TicketFormValues>) => void
  onDelete: () => void
  onMessage: (message: string) => void
  onAttachmentsChanged: () => void
}

const selectClass =
  'rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[11px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/30'

export default function TicketDetailPanel({
  ticket,
  userId,
  editing,
  saving = false,
  editValues,
  onStartEdit,
  onCancelEdit,
  onEditChange,
  onSave,
  onQuickUpdate,
  onDelete,
  onMessage,
  onAttachmentsChanged,
}: Props) {
  const attachmentsQuery = useQuery({
    queryKey: ['ticket-attachments', ticket.id],
    queryFn: () => fetchTicketAttachments(ticket.id),
    enabled: Boolean(ticket.id),
  })

  const [quickStatus, setQuickStatus] = useState(ticket.status)
  const [quickPriority, setQuickPriority] = useState(ticket.priority)
  const [quickType, setQuickType] = useState(ticket.type)

  useEffect(() => {
    setQuickStatus(ticket.status)
    setQuickPriority(ticket.priority)
    setQuickType(ticket.type)
  }, [ticket.id, ticket.status, ticket.priority, ticket.type])

  const statusStyle = STATUS_STYLES[ticket.status]
  const priorityStyle = PRIORITY_STYLES[ticket.priority]

  if (editing) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2.5">
          <div>
            <p className="font-mono text-[10px] font-semibold text-neutral-400">{ticketKey(ticket.id)}</p>
            <h2 className="text-sm font-semibold text-neutral-900">Edit ticket</h2>
          </div>
          <div className="flex gap-1.5">
            <button type="button" className="rounded border border-neutral-200 px-2 py-1 text-xs" onClick={onCancelEdit}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary px-2 py-1 text-xs"
              onClick={onSave}
              disabled={saving || !editValues.title.trim()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <TicketFormFields idPrefix="edit-ticket" values={editValues} compact onChange={onEditChange} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 px-4 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-semibold text-neutral-400">{ticketKey(ticket.id)}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
              <span className={`text-[10px] font-medium ${priorityStyle.color}`}>{priorityStyle.label}</span>
              <span className="text-[10px] text-neutral-500">{TYPE_LABELS[ticket.type]}</span>
            </div>
            <h2 className="mt-1 text-base font-semibold leading-snug text-neutral-900">{ticket.title}</h2>
            <p className="mt-0.5 text-[10px] text-neutral-400">
              Updated {new Date(ticket.updatedAt || ticket.createdAt || '').toLocaleString()}
              {ticket.assignee ? ` · ${ticket.assignee}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-xs"
              onClick={onStartEdit}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/5"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <select
            value={quickStatus}
            onChange={(event) => {
              const value = event.target.value as Ticket['status']
              setQuickStatus(value)
              onQuickUpdate({ status: value })
            }}
            className={selectClass}
            disabled={saving}
          >
            {TICKET_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={quickPriority}
            onChange={(event) => {
              const value = event.target.value as Ticket['priority']
              setQuickPriority(value)
              onQuickUpdate({ priority: value })
            }}
            className={selectClass}
            disabled={saving}
          >
            {TICKET_PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={quickType}
            onChange={(event) => {
              const value = event.target.value as Ticket['type']
              setQuickType(value)
              onQuickUpdate({ type: value })
            }}
            className={selectClass}
            disabled={saving}
          >
            {TICKET_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Description</h3>
            {ticket.description ? (
              <div className="whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-800">
                {ticket.description}
              </div>
            ) : (
              <p className="text-xs italic text-neutral-400">No description.</p>
            )}

            {userId ? (
              <div className="mt-4">
                <TicketAttachmentsList
                  ticketId={ticket.id}
                  userId={userId}
                  attachments={attachmentsQuery.data ?? []}
                  loading={attachmentsQuery.isLoading}
                  onChanged={() => {
                    void attachmentsQuery.refetch()
                    onAttachmentsChanged()
                  }}
                  onError={onMessage}
                />
              </div>
            ) : null}
          </div>

          <aside className="space-y-3">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Assignee</dt>
              <dd className="mt-0.5 text-xs text-neutral-800">{ticket.assignee || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Labels</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {ticket.labels.length > 0 ? (
                  ticket.labels.map((label) => (
                    <span
                      key={label}
                      className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-neutral-400">None</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Created</dt>
              <dd className="mt-0.5 text-xs text-neutral-600">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}
              </dd>
            </div>
            {saving ? (
              <p className="flex items-center gap-1 text-[10px] text-neutral-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}

export function ticketToFormValues(ticket: Ticket): TicketFormValues {
  return {
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    assignee: ticket.assignee,
    labels: labelsToInput(ticket.labels),
  }
}

export function formValuesToPayload(values: TicketFormValues) {
  return {
    title: values.title,
    description: values.description,
    status: values.status,
    priority: values.priority,
    type: values.type,
    assignee: values.assignee,
    labels: parseLabelsInput(values.labels),
  }
}

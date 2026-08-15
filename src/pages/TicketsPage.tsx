import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Search, Ticket } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import TicketCreateModal from '../components/tickets/TicketCreateModal'
import TicketDetailPanel, { formValuesToPayload, ticketToFormValues } from '../components/tickets/TicketDetailPanel'
import TicketList from '../components/tickets/TicketList'
import StatusBanner from '../components/ui/StatusBanner'
import { useAuth } from '../contexts/AuthContext'
import { makeId } from '../lib/id'
import { isSupabaseConfigured } from '../lib/supabase'
import { parseTicketSearch, ticketMatchesSearch, ticketMatchesStatus } from '../lib/ticket-search'
import { deleteTicket, fetchTickets, upsertTicket } from '../lib/tickets-api'
import type { TicketFormValues, TicketStatus, Ticket as TicketRecord } from '../types/ticket'

const EMPTY_FORM: TicketFormValues = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  assignee: '',
  labels: '',
}

const STATUS_FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

export default function TicketsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<TicketFormValues>(EMPTY_FORM)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createId, setCreateId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<TicketFormValues>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<TicketRecord | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const parsedSearch = useMemo(() => parseTicketSearch(debouncedSearch), [debouncedSearch])

  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
    enabled: isSupabaseConfigured,
  })

  const tickets = ticketsQuery.data ?? []
  const filteredTickets = useMemo(
    () =>
      tickets.filter(
        (item) => ticketMatchesSearch(item, parsedSearch) && ticketMatchesStatus(item, statusFilter),
      ),
    [tickets, parsedSearch, statusFilter],
  )

  const selectedTicket = useMemo(
    () => tickets.find((item) => item.id === selectedId) ?? null,
    [tickets, selectedId],
  )

  useEffect(() => {
    if (!parsedSearch.query && statusFilter === 'all') return
    if (filteredTickets.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredTickets.some((item) => item.id === selectedId)) {
      setSelectedId(filteredTickets[0].id)
    }
  }, [parsedSearch.query, statusFilter, filteredTickets, selectedId])

  useEffect(() => {
    if (selectedTicket) {
      setEditValues(ticketToFormValues(selectedTicket))
    }
  }, [selectedTicket])

  const saveMutation = useMutation({
    mutationFn: upsertTicket,
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedId(saved.id)
      setEditing(false)
      setCreateModalOpen(false)
      setCreateForm(EMPTY_FORM)
      setCreateId(null)
      setEditValues(ticketToFormValues(saved))
      setMessage('Ticket saved.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Save failed.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedId(null)
      setEditing(false)
      setDeleteTarget(null)
      setMessage('Ticket deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const openCreateModal = () => {
    setMessage(null)
    setCreateId(makeId())
    setCreateForm(EMPTY_FORM)
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (saveMutation.isPending) return
    setCreateModalOpen(false)
    setCreateForm(EMPTY_FORM)
    setCreateId(null)
  }

  const saveCreate = () => {
    if (!createId) return
    setMessage(null)
    void saveMutation.mutateAsync({ id: createId, ...formValuesToPayload(createForm) })
  }

  const saveCurrent = (patch?: Partial<TicketFormValues>) => {
    if (!selectedTicket) return
    const values = patch ? { ...editValues, ...patch } : editValues
    setEditValues(values)
    setMessage(null)
    void saveMutation.mutateAsync({ id: selectedTicket.id, ...formValuesToPayload(values) })
  }

  const highlightTerms = parsedSearch.query
    ? parsedSearch.exact
      ? [parsedSearch.query]
      : parsedSearch.query.split(/\s+/).filter(Boolean)
    : []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tickets.length }
    for (const ticket of tickets) {
      counts[ticket.status] = (counts[ticket.status] ?? 0) + 1
    }
    return counts
  }, [tickets])

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent-dark">Workspace</p>
          <h1 className="text-2xl font-heading font-semibold text-primary">Tickets</h1>
          <p className="text-xs text-neutral-600">Track tasks, bugs, and issues with attachments.</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={openCreateModal}>
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </section>

      <StatusBanner message={message} />

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use tickets.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <section className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 bg-neutral-50 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-neutral-800">Backlog</h2>
                <span className="rounded-full bg-neutral-200 px-1.5 py-px text-[10px] font-medium text-neutral-600">
                  {parsedSearch.query || statusFilter !== 'all' ? filteredTickets.length : tickets.length}
                </span>
              </div>

              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
                <input
                  id="tickets-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder='Search… "exact phrase"'
                  className="w-full rounded border border-neutral-300 bg-white py-1 pl-7 pr-2 text-xs outline-none ring-primary/20 focus:border-primary focus:ring-1"
                />
              </div>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {STATUS_FILTERS.map((filter) => {
                  const count = filter.value === 'all' ? statusCounts.all : (statusCounts[filter.value] ?? 0)
                  const active = statusFilter === filter.value
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatusFilter(filter.value)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                        active
                          ? 'bg-primary text-white'
                          : 'bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {filter.label}
                      {count > 0 ? ` (${count})` : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {ticketsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-xs text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="max-h-[min(75dvh,760px)] overflow-y-auto">
                <TicketList
                  tickets={filteredTickets}
                  selectedId={selectedId}
                  highlightTerms={highlightTerms}
                  onSelect={(id) => {
                    setSelectedId(id)
                    setEditing(false)
                  }}
                />
              </div>
            ) : (
              <div className="p-6 text-center">
                <Ticket className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <p className="text-xs text-neutral-600">
                  {parsedSearch.query || statusFilter !== 'all'
                    ? 'No tickets match your filters.'
                    : 'No tickets yet. Create your first one.'}
                </p>
                {!parsedSearch.query && statusFilter === 'all' ? (
                  <button type="button" className="btn-primary mt-3 px-3 py-1.5 text-xs" onClick={openCreateModal}>
                    Create ticket
                  </button>
                ) : null}
              </div>
            )}
          </section>

          <section className="min-h-[480px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            {selectedTicket ? (
              <TicketDetailPanel
                ticket={selectedTicket}
                userId={user?.id ?? null}
                editing={editing}
                saving={saveMutation.isPending}
                editValues={editValues}
                onStartEdit={() => {
                  setEditValues(ticketToFormValues(selectedTicket))
                  setEditing(true)
                }}
                onCancelEdit={() => {
                  setEditing(false)
                  setEditValues(ticketToFormValues(selectedTicket))
                }}
                onEditChange={(patch) => setEditValues((current) => ({ ...current, ...patch }))}
                onSave={() => saveCurrent()}
                onQuickUpdate={(patch) => saveCurrent(patch)}
                onDelete={() => setDeleteTarget(selectedTicket)}
                onMessage={setMessage}
                onAttachmentsChanged={() => void queryClient.invalidateQueries({ queryKey: ['tickets'] })}
              />
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-6 text-center">
                <Ticket className="mb-3 h-10 w-10 text-neutral-300" />
                <h3 className="text-sm font-medium text-primary">Select a ticket</h3>
                <p className="mt-1 max-w-xs text-xs text-neutral-600">
                  Pick from the backlog or create a new ticket to get started.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      <TicketCreateModal
        open={createModalOpen}
        values={createForm}
        saving={saveMutation.isPending}
        onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
        onSave={saveCreate}
        onCancel={closeCreateModal}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete ticket?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.title}" and all attachments.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}

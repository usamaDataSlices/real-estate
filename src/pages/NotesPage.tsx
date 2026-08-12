import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Search, StickyNote, Trash2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import StatusBanner from '../components/ui/StatusBanner'
import { deleteNote, fetchNotes, upsertNote } from '../lib/notes-api'
import { escapeRegExp, noteMatchesSearch, parseNoteSearch } from '../lib/note-search'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Note } from '../types/note'

type EditorState =
  | { mode: 'idle' }
  | { mode: 'create'; title: string; body: string }
  | { mode: 'edit'; noteId: string; title: string; body: string }

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

function notePreview(body: string) {
  const line = body.trim().split('\n').find(Boolean) ?? ''
  return line.length > 120 ? `${line.slice(0, 120)}…` : line || 'No content yet.'
}

export default function NotesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>({ mode: 'idle' })
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
    enabled: isSupabaseConfigured,
  })

  const notes = notesQuery.data ?? []
  const parsedSearch = useMemo(() => parseNoteSearch(search), [search])

  const filteredNotes = useMemo(
    () => notes.filter((note) => noteMatchesSearch(note, parsedSearch)),
    [notes, parsedSearch],
  )

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  )

  useEffect(() => {
    if (!parsedSearch.query) return
    if (filteredNotes.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredNotes.some((note) => note.id === selectedId)) {
      setSelectedId(filteredNotes[0].id)
    }
  }, [parsedSearch.query, filteredNotes, selectedId])

  const saveMutation = useMutation({
    mutationFn: upsertNote,
    onSuccess: async (noteId) => {
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedId(noteId)
      setEditor({ mode: 'idle' })
      setMessage('Note saved.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Save failed.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedId(null)
      setEditor({ mode: 'idle' })
      setDeleteTarget(null)
      setMessage('Note deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const startCreate = () => {
    setMessage(null)
    setSelectedId(null)
    setEditor({ mode: 'create', title: '', body: '' })
  }

  const startEdit = (note: Note) => {
    setMessage(null)
    setSelectedId(note.id)
    setEditor({ mode: 'edit', noteId: note.id, title: note.title, body: note.body })
  }

  const cancelEditor = () => {
    setEditor({ mode: 'idle' })
  }

  const saveEditor = () => {
    if (editor.mode === 'idle') return
    void saveMutation.mutateAsync({
      id: editor.mode === 'edit' ? editor.noteId : undefined,
      title: editor.title,
      body: editor.body,
    })
  }

  const viewingNote = editor.mode === 'idle' ? selectedNote : null
  const highlightTerms = parsedSearch.query
    ? parsedSearch.exact
      ? [parsedSearch.query]
      : parsedSearch.query.split(/\s+/).filter(Boolean)
    : []

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-dark">Workspace</p>
          <h1 className="text-3xl font-heading font-semibold text-primary">Notes</h1>
          <p className="mt-1 text-sm text-neutral-600">Create, search, and manage broker notes.</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={startCreate}>
          <Plus className="h-4 w-4" />
          New note
        </button>
      </section>

      <StatusBanner message={message} />

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use notes.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-neutral-700" htmlFor="notes-search">
              Search notes
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="notes-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Search title or body… use "exact phrase" for precise matches'
                className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
              />
            </div>
            {parsedSearch.query ? (
              <p className="mt-2 text-sm text-neutral-600">
                {filteredNotes.length === 0
                  ? 'No notes match your search.'
                  : `${filteredNotes.length} note${filteredNotes.length === 1 ? '' : 's'} found${parsedSearch.exact ? ' (exact phrase)' : ''}.`}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">{notes.length} notes total.</p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">All notes</h2>
              </div>

              {notesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading notes…
                </div>
              ) : filteredNotes.length > 0 ? (
                <ul className="max-h-[min(70dvh,720px)] divide-y divide-neutral-100 overflow-y-auto">
                  {filteredNotes.map((note) => {
                    const isSelected = note.id === selectedId
                    return (
                      <li key={note.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(note.id)
                            setEditor({ mode: 'idle' })
                          }}
                          className={`w-full px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                            isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''
                          }`}
                        >
                          <p className="font-medium text-primary">
                            <HighlightedText text={note.title} terms={highlightTerms} />
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                            <HighlightedText text={notePreview(note.body)} terms={highlightTerms} />
                          </p>
                          <p className="mt-2 text-xs text-neutral-400">
                            Updated {new Date(note.updatedAt || note.createdAt || '').toLocaleString()}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <StickyNote className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
                  <p className="text-sm text-neutral-600">
                    {parsedSearch.query ? 'Try a different search term.' : 'No notes yet. Create your first note.'}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              {editor.mode !== 'idle' ? (
                <div className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-primary">
                      {editor.mode === 'create' ? 'New note' : 'Edit note'}
                    </h2>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm" onClick={cancelEditor}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary px-3 py-1.5 text-sm"
                        onClick={saveEditor}
                        disabled={saveMutation.isPending || !editor.title.trim()}
                      >
                        {saveMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editor.title}
                    onChange={(event) => setEditor((current) => (current.mode === 'idle' ? current : { ...current, title: event.target.value }))}
                    placeholder="Note title"
                    className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    value={editor.body}
                    onChange={(event) => setEditor((current) => (current.mode === 'idle' ? current : { ...current, body: event.target.value }))}
                    placeholder="Write your note here…"
                    rows={16}
                    className="min-h-[320px] w-full flex-1 resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ) : viewingNote ? (
                <div className="flex h-full flex-col p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-primary">
                        <HighlightedText text={viewingNote.title} terms={highlightTerms} />
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Updated {new Date(viewingNote.updatedAt || viewingNote.createdAt || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm" onClick={() => startEdit(viewingNote)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5"
                        onClick={() => setDeleteTarget(viewingNote)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="min-h-[320px] flex-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm leading-7 text-neutral-800">
                    <HighlightedText text={viewingNote.body || 'No content.'} terms={highlightTerms} />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                  <StickyNote className="mb-4 h-12 w-12 text-neutral-300" />
                  <h3 className="text-lg font-medium text-primary">Select a note</h3>
                  <p className="mt-1 max-w-sm text-sm text-neutral-600">
                    Pick a note from the list or search to jump straight to the match.
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete note?"
        description={deleteTarget ? `This will permanently remove "${deleteTarget.title}". This action cannot be undone.` : ''}
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

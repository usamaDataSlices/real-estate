import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Search, StickyNote } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import NoteEditorPanel from '../components/notes/NoteEditorPanel'
import StatusBanner from '../components/ui/StatusBanner'
import { useAuth } from '../contexts/AuthContext'
import { makeId } from '../lib/id'
import { escapeRegExp, noteMatchesSearch, parseNoteSearch } from '../lib/note-search'
import { collectNoteImageStoragePaths } from '../lib/tiptap/note-content'
import { noteDebug } from '../lib/notes-debug'
import { deleteNote, fetchNotes, searchNotesServer } from '../lib/notes-api'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Note } from '../types/note'

type ActiveEditor = {
  noteId: string
  isNew: boolean
}

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

function notePreview(note: Note) {
  const line = note.contentPlain.trim().split('\n').find(Boolean) ?? ''
  return line.length > 120 ? `${line.slice(0, 120)}…` : line || 'No content yet.'
}

export default function NotesPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const parsedSearch = useMemo(() => parseNoteSearch(debouncedSearch), [debouncedSearch])

  const notesQuery = useQuery({
    queryKey: ['notes', debouncedSearch.trim()],
    queryFn: () =>
      debouncedSearch.trim()
        ? searchNotesServer(parsedSearch.query, parsedSearch.exact)
        : fetchNotes(),
    enabled: isSupabaseConfigured,
  })

  const notes = notesQuery.data ?? []
  const filteredNotes = useMemo(
    () => notes.filter((note) => noteMatchesSearch(note, parsedSearch)),
    [notes, parsedSearch],
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

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedId(null)
      setActiveEditor(null)
      setDeleteTarget(null)
      setMessage('Note deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const startCreate = () => {
    setMessage(null)
    const noteId = makeId()
    setSelectedId(noteId)
    setActiveEditor({ noteId, isNew: true })
  }

  const openNote = (noteId: string) => {
    setMessage(null)
    setSelectedId(noteId)
    setActiveEditor({ noteId, isNew: false })
  }

  const closeEditor = () => {
    setActiveEditor(null)
  }

  const highlightTerms = parsedSearch.query
    ? parsedSearch.exact
      ? [parsedSearch.query]
      : parsedSearch.query.split(/\s+/).filter(Boolean)
    : []

  const patchNotesListCache = (savedNote: {
    id: string
    title: string
    contentPlain: string
    updatedAt: string
  }) => {
    queryClient.setQueriesData<Note[]>({ queryKey: ['notes'] }, (old) => {
      if (!old) return old
      const listItem: Note = {
        id: savedNote.id,
        title: savedNote.title,
        contentPlain: savedNote.contentPlain,
        contentJson: { type: 'doc', content: [] },
        updatedAt: savedNote.updatedAt,
      }
      const index = old.findIndex((note) => note.id === savedNote.id)
      if (index === -1) return [listItem, ...old]
      const next = [...old]
      next[index] = { ...next[index], ...listItem }
      next.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      return next
    })
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-dark">Workspace</p>
          <h1 className="text-2xl font-heading font-semibold text-primary">Notes</h1>
          <p className="mt-1 text-sm text-neutral-600">Rich-text notes with attachments and full-text search.</p>
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
      ) : !user ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
          Sign in to create and edit notes.
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
                placeholder='Search title or content… use "exact phrase" for precise matches'
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

          <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-3 py-2">
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
                          onClick={() => openNote(note.id)}
                          className={`w-full px-3 py-2 text-left transition-colors hover:bg-neutral-50 ${
                            isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''
                          }`}
                        >
                          <p className="font-medium text-primary">
                            <HighlightedText text={note.title} terms={highlightTerms} />
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                            <HighlightedText text={notePreview(note)} terms={highlightTerms} />
                          </p>
                          <p className="mt-1 text-xs text-neutral-400">
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
              {activeEditor ? (
                <NoteEditorPanel
                  key={activeEditor.noteId}
                  noteId={activeEditor.noteId}
                  userId={user.id}
                  isNew={activeEditor.isNew}
                  onSaved={(savedNote) => {
                    noteDebug('cache:setQueryData', {
                      noteId: savedNote.id,
                      storagePaths: collectNoteImageStoragePaths(savedNote.contentJson),
                    })
                    queryClient.setQueryData(['note', savedNote.id], savedNote)
                    patchNotesListCache(savedNote)
                    if (activeEditor.isNew) {
                      setActiveEditor({ noteId: savedNote.id, isNew: false })
                    }
                  }}
                  onDelete={() => {
                    const target = filteredNotes.find((note) => note.id === activeEditor.noteId)
                    if (target) setDeleteTarget(target)
                    else {
                      setDeleteTarget({
                        id: activeEditor.noteId,
                        title: 'Untitled note',
                        contentJson: { type: 'doc', content: [] },
                        contentPlain: '',
                      })
                    }
                  }}
                  onClose={closeEditor}
                  onError={setMessage}
                />
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
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
          if (!deleteTarget) return
          const exists = notes.some((note) => note.id === deleteTarget.id)
          if (!exists) {
            setActiveEditor(null)
            setSelectedId(null)
            setDeleteTarget(null)
            return
          }
          deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}

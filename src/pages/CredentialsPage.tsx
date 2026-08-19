import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Eye, EyeOff, KeyRound, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import CredentialCreateModal from '../components/credentials/CredentialCreateModal'
import CredentialFormFields from '../components/credentials/CredentialFormFields'
import CredentialTicketList, { credentialKey } from '../components/credentials/CredentialTicketList'
import StatusBanner from '../components/ui/StatusBanner'
import {
  credentialMatchesSearch,
  escapeRegExp,
  parseCredentialSearch,
} from '../lib/credential-search'
import { deleteCredential, fetchCredentials, upsertCredential } from '../lib/credentials-api'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Credential, CredentialFormValues } from '../types/credential'
import { makeId } from '../lib/id'

type EditorState =
  | { mode: 'idle' }
  | { mode: 'edit'; id: string; values: CredentialFormValues }

const EMPTY_FORM: CredentialFormValues = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
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

async function copyText(value: string) {
  await navigator.clipboard.writeText(value)
}

export default function CredentialsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>({ mode: 'idle' })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createId, setCreateId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CredentialFormValues>(EMPTY_FORM)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const parsedSearch = useMemo(() => parseCredentialSearch(debouncedSearch), [debouncedSearch])

  const credentialsQuery = useQuery({
    queryKey: ['credentials'],
    queryFn: fetchCredentials,
    enabled: isSupabaseConfigured,
  })

  const credentials = credentialsQuery.data ?? []
  const filteredCredentials = useMemo(
    () => credentials.filter((item) => credentialMatchesSearch(item, parsedSearch)),
    [credentials, parsedSearch],
  )

  const selectedCredential = useMemo(
    () => credentials.find((item) => item.id === selectedId) ?? null,
    [credentials, selectedId],
  )

  useEffect(() => {
    if (!parsedSearch.query) return
    if (filteredCredentials.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredCredentials.some((item) => item.id === selectedId)) {
      setSelectedId(filteredCredentials[0].id)
    }
  }, [parsedSearch.query, filteredCredentials, selectedId])

  const saveMutation = useMutation({
    mutationFn: upsertCredential,
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['credentials'] })
      setSelectedId(saved.id)
      setEditor({ mode: 'idle' })
      setCreateModalOpen(false)
      setCreateForm(EMPTY_FORM)
      setCreateId(null)
      setShowCreatePassword(false)
      setMessage('Credential saved.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Save failed.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['credentials'] })
      setSelectedId(null)
      setEditor({ mode: 'idle' })
      setDeleteTarget(null)
      setMessage('Credential deleted.')
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Delete failed.')
    },
  })

  const openCreateModal = () => {
    setMessage(null)
    setCreateId(makeId())
    setCreateForm(EMPTY_FORM)
    setShowCreatePassword(false)
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (saveMutation.isPending) return
    setCreateModalOpen(false)
    setCreateForm(EMPTY_FORM)
    setCreateId(null)
    setShowCreatePassword(false)
  }

  const saveCreate = () => {
    if (!createId) return
    setMessage(null)
    void saveMutation.mutateAsync({ id: createId, ...createForm })
  }

  const startEdit = (credential: Credential) => {
    setMessage(null)
    setSelectedId(credential.id)
    setShowPassword(false)
    setEditor({
      mode: 'edit',
      id: credential.id,
      values: {
        title: credential.title,
        username: credential.username,
        password: credential.password,
        url: credential.url,
        notes: credential.notes,
      },
    })
  }

  const updateEditorValues = (patch: Partial<CredentialFormValues>) => {
    setEditor((current) =>
      current.mode === 'idle' ? current : { ...current, values: { ...current.values, ...patch } },
    )
  }

  const saveEditor = () => {
    if (editor.mode !== 'edit') return
    setMessage(null)
    void saveMutation.mutateAsync({ id: editor.id, ...editor.values })
  }

  const highlightTerms = parsedSearch.query
    ? parsedSearch.exact
      ? [parsedSearch.query]
      : parsedSearch.query.split(/\s+/).filter(Boolean)
    : []

  const viewing = editor.mode === 'idle' ? selectedCredential : null

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-dark">Workspace</p>
          <h1 className="text-2xl font-heading font-semibold text-primary">Credentials</h1>
          <p className="mt-1 text-sm text-neutral-600">Store portal logins, API keys, and other secure access details.</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          New credential
        </button>
      </section>

      <StatusBanner message={message} />

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use credentials storage.
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
            <section className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-neutral-800">All credentials</h2>
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    {parsedSearch.query ? filteredCredentials.length : credentials.length}
                  </span>
                </div>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="credentials-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder='Search… use "exact phrase"'
                    className="w-full rounded-md border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-2"
                  />
                </div>
                {parsedSearch.query ? (
                  <p className="mt-1.5 text-[11px] text-neutral-500">
                    {filteredCredentials.length === 0
                      ? 'No matches'
                      : `${filteredCredentials.length} result${filteredCredentials.length === 1 ? '' : 's'}${parsedSearch.exact ? ' · exact phrase' : ''}`}
                  </p>
                ) : null}
              </div>

              {credentialsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading credentials…
                </div>
              ) : filteredCredentials.length > 0 ? (
                <div className="max-h-[min(70dvh,720px)] overflow-y-auto">
                  <CredentialTicketList
                    credentials={filteredCredentials}
                    selectedId={selectedId}
                    highlightTerms={highlightTerms}
                    onSelect={(id) => {
                      setSelectedId(id)
                      setEditor({ mode: 'idle' })
                      setShowPassword(false)
                    }}
                  />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <KeyRound className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
                  <p className="text-sm text-neutral-600">
                    {parsedSearch.query ? 'Try a different search term.' : 'No credentials yet. Add your first one.'}
                  </p>
                  {!parsedSearch.query ? (
                    <button type="button" className="btn-primary mt-4" onClick={openCreateModal}>
                      New credential
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              {editor.mode === 'edit' ? (
                <div className="flex h-full flex-col p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-primary">Edit credential</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
                        onClick={() => setEditor({ mode: 'idle' })}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary px-3 py-1.5 text-sm"
                        onClick={saveEditor}
                        disabled={saveMutation.isPending || !editor.values.title.trim()}
                      >
                        {saveMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <CredentialFormFields
                    idPrefix="edit-credential"
                    values={editor.values}
                    showPassword={showPassword}
                    onShowPasswordChange={setShowPassword}
                    onChange={updateEditorValues}
                  />
                </div>
              ) : viewing ? (
                <div className="flex h-full flex-col p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-neutral-500">{credentialKey(viewing.id)}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-primary">
                        <HighlightedText text={viewing.title} terms={highlightTerms} />
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Updated {new Date(viewing.updatedAt || viewing.createdAt || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
                        onClick={() => startEdit(viewing)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5"
                        onClick={() => setDeleteTarget(viewing)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <dl className="space-y-3">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Username</dt>
                      <dd className="mt-1 flex items-center justify-between gap-3">
                        <span className="break-all text-sm text-neutral-900">{viewing.username || '—'}</span>
                        {viewing.username ? (
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs"
                            onClick={() => void copyText(viewing.username).then(() => setMessage('Username copied.'))}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        ) : null}
                      </dd>
                    </div>

                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Password</dt>
                      <dd className="mt-1 flex items-center justify-between gap-3">
                        <span className="break-all font-mono text-sm text-neutral-900">
                          {showPassword ? viewing.password || '—' : viewing.password ? '••••••••••••' : '—'}
                        </span>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs"
                            onClick={() => setShowPassword((current) => !current)}
                          >
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                          {viewing.password ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs"
                              onClick={() => void copyText(viewing.password).then(() => setMessage('Password copied.'))}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </button>
                          ) : null}
                        </div>
                      </dd>
                    </div>

                    {viewing.url ? (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">URL</dt>
                        <dd className="mt-1">
                          <a
                            href={viewing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-sm text-primary underline"
                          >
                            <HighlightedText text={viewing.url} terms={highlightTerms} />
                          </a>
                        </dd>
                      </div>
                    ) : null}

                    {viewing.notes ? (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                          <HighlightedText text={viewing.notes} terms={highlightTerms} />
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                  <KeyRound className="mb-4 h-12 w-12 text-neutral-300" />
                  <h3 className="text-lg font-medium text-primary">Select a credential</h3>
                  <p className="mt-1 max-w-sm text-sm text-neutral-600">
                    Pick an entry from the list or search to view login details.
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <CredentialCreateModal
        open={createModalOpen}
        values={createForm}
        showPassword={showCreatePassword}
        saving={saveMutation.isPending}
        onShowPasswordChange={setShowCreatePassword}
        onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
        onSave={saveCreate}
        onCancel={closeCreateModal}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete credential?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.title}". This action cannot be undone.`
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

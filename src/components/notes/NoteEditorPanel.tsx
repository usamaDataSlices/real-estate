import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Loader2, Trash2, X } from 'lucide-react'
import NoteEditorToolbar from './NoteEditorToolbar'
import NoteAttachmentsList from './NoteAttachmentsList'
import { NoteImage } from './note-image-extension'
import { EMPTY_TIPTAP_DOC } from '../../lib/tiptap/content'
import {
  collectNoteImageStoragePaths,
  noteContentSnapshot,
  parseNoteStorageSrc,
  sanitizeNoteContentForSave,
} from '../../lib/tiptap/note-content'
import { noteDebug, noteDebugJson } from '../../lib/notes-debug'
import { fetchNoteAttachments, fetchNoteById, upsertNote } from '../../lib/notes-api'
import { refreshInlineImageUrl, uploadInlineNoteImage, uploadNoteDocument } from '../../lib/note-attachments-api'
import { validateNoteFile } from '../../lib/note-uploads'
import type { NoteAttachment, NoteSaveStatus } from '../../types/note'
import './note-editor.css'

type SavedNotePayload = {
  id: string
  title: string
  contentJson: JSONContent
  contentPlain: string
  updatedAt: string
}

type Props = {
  noteId: string
  userId: string
  isNew: boolean
  onSaved: (saved: SavedNotePayload) => void
  onDelete: () => void
  onClose: () => void
  onError: (message: string) => void
}

function imageSummary(doc: JSONContent) {
  const paths = collectNoteImageStoragePaths(doc)
  return { imageCount: paths.length, storagePaths: paths }
}

async function refreshImageUrlsInDoc(doc: JSONContent): Promise<JSONContent> {
  const clone = structuredClone(doc)

  const walk = async (node: JSONContent) => {
    if (node.type === 'image' && node.attrs) {
      const storagePath =
        (typeof node.attrs.storagePath === 'string' && node.attrs.storagePath)
        || parseNoteStorageSrc(node.attrs.src)

      if (storagePath) {
        node.attrs.storagePath = storagePath
        try {
          node.attrs.src = await refreshInlineImageUrl(storagePath)
        } catch (error) {
          noteDebug('image:refresh-failed', { storagePath, error: String(error) })
        }
      }
    }
    if (node.content) {
      await Promise.all(node.content.map(walk))
    }
  }

  if (clone.content) await Promise.all(clone.content.map(walk))
  return clone
}

async function waitForEditorDoc(editor: Editor) {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
  return editor.getJSON()
}

export default function NoteEditorPanel({
  noteId,
  userId,
  isNew,
  onSaved,
  onDelete,
  onClose,
  onError,
}: Props) {
  const [title, setTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle')
  const [attachments, setAttachments] = useState<NoteAttachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [contentReady, setContentReady] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDraftRef = useRef({ title: '', contentJson: EMPTY_TIPTAP_DOC as JSONContent })
  const editorRef = useRef<Editor | null>(null)
  const uploadImageRef = useRef<(file: File) => Promise<void>>(async () => {})
  const scheduleSaveRef = useRef<() => void>(() => {})
  const hydratedNoteIdRef = useRef<string | null>(null)
  const pendingHydrateContentRef = useRef<JSONContent | null>(null)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const saveGenerationRef = useRef(0)
  const isNewRef = useRef(isNew)
  isNewRef.current = isNew

  useEffect(() => {
    noteDebug('editor:mount', { noteId, isNew })
    return () => noteDebug('editor:unmount', { noteId })
  }, [noteId, isNew])

  const syncDraftFromEditor = useCallback(() => {
    const currentEditor = editorRef.current
    if (!currentEditor) return latestDraftRef.current.contentJson
    latestDraftRef.current.contentJson = currentEditor.getJSON()
    return latestDraftRef.current.contentJson
  }, [])

  const persistNote = useCallback(async (): Promise<boolean> => {
    const contentJson = syncDraftFromEditor()
    const draft = latestDraftRef.current
    draft.contentJson = contentJson

    noteDebug('persist:called', {
      noteId,
      title: draft.title,
      ...imageSummary(contentJson),
    })

    if (!draft.title.trim()) {
      setSaveStatus('idle')
      noteDebug('persist:skipped', { reason: 'missing-title' })
      return false
    }

    const snapshot = noteContentSnapshot(draft)
    if (snapshot === lastSavedSnapshotRef.current) {
      setSaveStatus('saved')
      noteDebug('persist:skipped', { reason: 'unchanged-snapshot' })
      return true
    }

    if (isSavingRef.current) {
      pendingSaveRef.current = true
      noteDebug('persist:deferred', { reason: 'save-in-flight' })
      return false
    }

    const generation = ++saveGenerationRef.current
    isSavingRef.current = true
    setSaveStatus('saving')

    const payload = sanitizeNoteContentForSave(contentJson)
    noteDebugJson('persist:payload', {
      noteId,
      title: draft.title.trim(),
      contentJson: payload,
      ...imageSummary(payload),
    })

    try {
      noteDebug('persist:request', { noteId, generation })
      const saved = await upsertNote({
        id: noteId,
        title: draft.title,
        contentJson: payload,
      })
      noteDebug('persist:response', {
        noteId: saved.id,
        generation,
        ...imageSummary(saved.contentJson),
      })

      if (generation !== saveGenerationRef.current) {
        noteDebug('persist:stale-generation', { generation, current: saveGenerationRef.current })
        return false
      }

      lastSavedSnapshotRef.current = snapshot
      setSaveStatus('saved')
      noteDebug('persist:onSaved-callback', { noteId: saved.id })
      onSaved(saved)
      return true
    } catch (error) {
      if (generation !== saveGenerationRef.current) return false
      setSaveStatus('error')
      noteDebug('persist:error', { error: error instanceof Error ? error.message : String(error) })
      onError(error instanceof Error ? error.message : 'Autosave failed.')
      return false
    } finally {
      if (generation === saveGenerationRef.current) {
        isSavingRef.current = false
      }
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        noteDebug('persist:run-pending')
        void persistNote()
      }
    }
  }, [noteId, onError, onSaved, syncDraftFromEditor])

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    return persistNote()
  }, [persistNote])

  const flushSaveWithRetry = useCallback(
    async (attempts = 8) => {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const saved = await flushSave()
        if (saved) return true
        noteDebug('flush:retry', { attempt, noteId })
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
      return false
    },
    [flushSave, noteId],
  )

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persistNote()
    }, 1500)
  }, [persistNote])

  scheduleSaveRef.current = scheduleSave

  const uploadImageFile = useCallback(
    async (file: File) => {
      const currentEditor = editorRef.current
      if (!currentEditor) return

      const noteTitle = title.trim()
      if (!noteTitle) {
        onError('Add a note title before uploading images.')
        return
      }

      validateNoteFile(file, 'inline-image')
      setUploadProgress(0)

      try {
        latestDraftRef.current.title = noteTitle
        noteDebug('upload:start', { noteId, fileName: file.name, fileSize: file.size })
        await flushSaveWithRetry()

        const { signedUrl, storagePath } = await uploadInlineNoteImage(file, userId, noteId, (progress) => {
          setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
        })
        noteDebug('upload:storage-complete', { storagePath })

        currentEditor
          .chain()
          .focus()
          .insertContent({
            type: 'image',
            attrs: { src: signedUrl, storagePath, alt: file.name },
          })
          .run()

        const contentAfterInsert = await waitForEditorDoc(currentEditor)
        latestDraftRef.current.contentJson = contentAfterInsert
        noteDebug('upload:inserted', {
          storagePath,
          ...imageSummary(contentAfterInsert),
        })

        const paths = collectNoteImageStoragePaths(contentAfterInsert)
        if (!paths.includes(storagePath)) {
          throw new Error('Image was uploaded but not added to the note. Try again.')
        }

        noteDebug('upload:persist-after-insert')
        const saved = await flushSaveWithRetry()
        if (!saved) {
          throw new Error('Image uploaded but note save failed. Try saving again.')
        }
        noteDebug('upload:complete', { storagePath })
      } catch (error) {
        noteDebug('upload:error', { error: error instanceof Error ? error.message : String(error) })
        onError(error instanceof Error ? error.message : 'Image upload failed.')
      } finally {
        setUploadProgress(null)
      }
    },
    [flushSaveWithRetry, noteId, onError, title, userId],
  )

  uploadImageRef.current = uploadImageFile

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      NoteImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Start writing your note…' }),
    ],
    content: EMPTY_TIPTAP_DOC,
    onUpdate: ({ editor: currentEditor }) => {
      latestDraftRef.current.contentJson = currentEditor.getJSON()
      scheduleSaveRef.current()
    },
    editorProps: {
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement
        if (target.tagName === 'IMG') {
          setLightboxSrc((target as HTMLImageElement).src)
          return true
        }
        return false
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        const image = Array.from(files).find((file) => file.type.startsWith('image/'))
        if (!image) return false
        event.preventDefault()
        void uploadImageRef.current(image)
        return true
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              event.preventDefault()
              void uploadImageRef.current(file)
              return true
            }
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    latestDraftRef.current.title = title
    scheduleSave()
  }, [title, scheduleSave])

  // Hydrate editor content exactly once per noteId — never on parent query refetches.
  useEffect(() => {
    let cancelled = false

    hydratedNoteIdRef.current = null
    lastSavedSnapshotRef.current = null
    pendingHydrateContentRef.current = null
    noteDebug('hydrate:reset-refs', { noteId })

    const hydrate = async () => {
      noteDebug('hydrate:start', { noteId, isNew: isNewRef.current })
      setContentReady(false)

      if (isNewRef.current) {
        setTitle('')
        latestDraftRef.current = { title: '', contentJson: EMPTY_TIPTAP_DOC }
        pendingHydrateContentRef.current = EMPTY_TIPTAP_DOC
        editorRef.current?.commands.setContent(EMPTY_TIPTAP_DOC, { emitUpdate: false })
        hydratedNoteIdRef.current = noteId
        setContentReady(true)
        noteDebug('hydrate:complete-new', { noteId })
        return
      }

      try {
        const fetched = await fetchNoteById(noteId)
        if (cancelled) return

        noteDebugJson('hydrate:fetched-raw', {
          noteId,
          contentJson: fetched.contentJson,
          ...imageSummary(fetched.contentJson),
        })

        const refreshed = await refreshImageUrlsInDoc(fetched.contentJson)
        if (cancelled) return

        noteDebugJson('hydrate:fetched-refreshed', {
          noteId,
          contentJson: refreshed,
          ...imageSummary(refreshed),
        })

        setTitle(fetched.title)
        latestDraftRef.current = { title: fetched.title, contentJson: refreshed }
        lastSavedSnapshotRef.current = noteContentSnapshot({ title: fetched.title, contentJson: refreshed })
        pendingHydrateContentRef.current = refreshed
        if (editorRef.current) {
          editorRef.current.commands.setContent(refreshed, { emitUpdate: false })
          pendingHydrateContentRef.current = null
        }
        hydratedNoteIdRef.current = noteId
        setContentReady(true)
        noteDebug('hydrate:complete-existing', { noteId })
      } catch (error) {
        if (cancelled) return
        noteDebug('hydrate:error', { noteId, error: error instanceof Error ? error.message : String(error) })
        onError(error instanceof Error ? error.message : 'Failed to load note.')
        setContentReady(true)
      }
    }

    void hydrate()

    return () => {
      cancelled = true
      noteDebug('hydrate:cancel', { noteId })
    }
  }, [noteId, onError])

  useEffect(() => {
    if (!editor || !pendingHydrateContentRef.current) return
    noteDebug('hydrate:apply-pending-content', { noteId })
    editor.commands.setContent(pendingHydrateContentRef.current, { emitUpdate: false })
    latestDraftRef.current.contentJson = pendingHydrateContentRef.current
    pendingHydrateContentRef.current = null
  }, [editor, noteId])

  useEffect(() => {
    let cancelled = false
    const loadAttachments = async () => {
      setAttachmentsLoading(true)
      try {
        const rows = await fetchNoteAttachments(noteId)
        if (!cancelled) setAttachments(rows)
      } catch (error) {
        if (!cancelled) onError(error instanceof Error ? error.message : 'Failed to load attachments.')
      } finally {
        if (!cancelled) setAttachmentsLoading(false)
      }
    }
    void loadAttachments()
    return () => {
      cancelled = true
    }
  }, [noteId, onError])

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    syncDraftFromEditor()
    const draft = latestDraftRef.current
    if (!draft.title.trim()) return
    const snapshot = noteContentSnapshot(draft)
    if (snapshot === lastSavedSnapshotRef.current) return
    noteDebug('persist:flush-on-unmount', { noteId, ...imageSummary(draft.contentJson) })
    void upsertNote({ id: noteId, title: draft.title, contentJson: draft.contentJson })
  }, [noteId, syncDraftFromEditor])

  const handleDocumentUpload = async (file: File) => {
    setUploadProgress(0)
    try {
      const attachment = await uploadNoteDocument(file, userId, noteId, (progress) => {
        setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
      })
      setAttachments((current) => [attachment, ...current])
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploadProgress(null)
    }
  }

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved'
        : saveStatus === 'error'
          ? 'Save failed'
          : title.trim()
            ? 'Unsaved changes'
            : 'Add a title to save'

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            className="w-full border-0 bg-transparent text-2xl font-semibold text-primary outline-none placeholder:text-neutral-400"
          />
          <p className={`mt-1 text-xs ${saveStatus === 'error' ? 'text-danger' : 'text-neutral-500'}`}>{saveLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
            onClick={() => {
              void flushSave()
              onClose()
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger/5"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {!contentReady || !editor ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading editor…
        </div>
      ) : (
        <div className="note-editor note-editor-surface flex-1">
          <NoteEditorToolbar
            editor={editor}
            onInsertImage={() => imageInputRef.current?.click()}
            onAttachDocument={() => documentInputRef.current?.click()}
          />
          <EditorContent editor={editor} />
        </div>
      )}

      <NoteAttachmentsList
        attachments={attachments}
        loading={attachmentsLoading}
        uploadProgress={uploadProgress}
        onUploadClick={() => documentInputRef.current?.click()}
        onDeleted={async () => {
          const rows = await fetchNoteAttachments(noteId)
          setAttachments(rows)
        }}
        onError={onError}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file && editor) void uploadImageFile(file)
          event.target.value = ''
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleDocumentUpload(file)
          event.target.value = ''
        }}
      />

      {lightboxSrc ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxSrc(null)}>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="Expanded note attachment"
            className="max-h-[90dvh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  )
}

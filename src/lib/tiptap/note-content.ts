import type { JSONContent } from '@tiptap/react'

export const NOTE_STORAGE_SRC_PREFIX = 'note-storage://'

export function toNoteStorageSrc(storagePath: string) {
  return `${NOTE_STORAGE_SRC_PREFIX}${storagePath}`
}

export function parseNoteStorageSrc(src: unknown): string | null {
  if (typeof src !== 'string' || !src.startsWith(NOTE_STORAGE_SRC_PREFIX)) return null
  return src.slice(NOTE_STORAGE_SRC_PREFIX.length)
}

export function sanitizeNoteContentForSave(doc: JSONContent): JSONContent {
  const clone = structuredClone(doc)

  const walk = (node: JSONContent) => {
    if (node.type === 'image' && node.attrs) {
      const storagePath =
        (typeof node.attrs.storagePath === 'string' && node.attrs.storagePath)
        || parseNoteStorageSrc(node.attrs.src)
        || null

      node.attrs = {
        alt: typeof node.attrs.alt === 'string' ? node.attrs.alt : '',
        storagePath,
        src: storagePath ? toNoteStorageSrc(storagePath) : (typeof node.attrs.src === 'string' ? node.attrs.src : ''),
      }
    }
    node.content?.forEach(walk)
  }

  clone.content?.forEach(walk)
  return clone
}

export function noteContentSnapshot(draft: { title: string; contentJson: JSONContent }) {
  return JSON.stringify({
    title: draft.title.trim(),
    content: sanitizeNoteContentForSave(draft.contentJson),
  })
}

export function collectNoteImageStoragePaths(doc: JSONContent): string[] {
  const paths: string[] = []

  const walk = (node: JSONContent) => {
    if (node.type === 'image' && node.attrs) {
      const storagePath =
        (typeof node.attrs.storagePath === 'string' && node.attrs.storagePath)
        || parseNoteStorageSrc(node.attrs.src)
      if (storagePath) paths.push(storagePath)
    }
    node.content?.forEach(walk)
  }

  doc.content?.forEach(walk)
  return paths
}

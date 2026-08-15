import type { JSONContent } from '@tiptap/react'

export type Note = {
  id: string
  title: string
  contentJson: JSONContent
  contentPlain: string
  createdAt?: string
  updatedAt?: string
}

export type NoteAttachment = {
  id: string
  noteId: string
  userId: string
  filePath: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt?: string
}

export type NoteSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type NoteEditorDraft = {
  noteId: string
  title: string
  contentJson: JSONContent
}

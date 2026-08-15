import type { JSONContent } from '@tiptap/react'

export const EMPTY_TIPTAP_DOC: JSONContent = {
  type: 'doc',
  content: [],
}

export function plaintextToTiptapDoc(text: string): JSONContent {
  const lines = text.split('\n')
  if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
    return EMPTY_TIPTAP_DOC
  }

  return {
    type: 'doc',
    content: lines.map((line) =>
      line.trim()
        ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
        : { type: 'paragraph' },
    ),
  }
}

export function tiptapJsonToPlaintext(doc: JSONContent | null | undefined): string {
  if (!doc) return ''

  const chunks: string[] = []

  const walk = (node: JSONContent) => {
    if (node.type === 'text' && node.text) {
      chunks.push(node.text)
      return
    }

    if (node.type === 'hardBreak') {
      chunks.push('\n')
      return
    }

    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem') {
      if (chunks.length > 0 && !chunks[chunks.length - 1]?.endsWith('\n')) {
        chunks.push('\n')
      }
    }

    node.content?.forEach(walk)
  }

  doc.content?.forEach(walk)
  return chunks.join('').replace(/\n+$/, '').trimEnd()
}

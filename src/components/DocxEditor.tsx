import { useRef, useEffect } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Heading1, Heading2, Heading3, Text,
  Download, Save, X
} from 'lucide-react'
import DOMPurify from 'dompurify'

type Props = {
  initialContent: string
  title: string
  onTitleChange: (v: string) => void
  onSave?: (content: string) => void
  onExport?: (content: string) => void
  onCancel?: () => void
}

export default function DocxEditor({ initialContent, title, onTitleChange, onSave, onExport, onCancel }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Initialize content ONLY when component mounts or initialContent changes and we haven't touched it much.
  // Actually, standard contentEditable pattern: set it once.
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== initialContent) {
      // Clean the HTML from mammoth (or db) to ensure it is safe
      const cleanHtml = DOMPurify.sanitize(initialContent, { ADD_ATTR: ['target'] })
      contentRef.current.innerHTML = cleanHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent])

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    contentRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
      {/* Top action bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-neutral-200 z-10 shrink-0 shadow-sm">
        <div className="flex-1 mr-4">
          <input
            type="text"
            className="w-full text-lg font-semibold bg-transparent border-0 border-b border-transparent hover:border-neutral-200 focus:border-primary px-0 py-1 transition-colors"
            placeholder="Document Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <button onClick={onCancel} className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors" title="Cancel">
              <X className="w-5 h-5" />
            </button>
          )}
          {onExport && (
            <button
              onClick={() => onExport(contentRef.current?.innerHTML || '')}
              className="px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              title="Download DOCX"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {onSave && (
            <button
              onClick={() => onSave(contentRef.current?.innerHTML || '')}
              className="px-4 py-1.5 flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-accent-dark rounded-md transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-white px-4 py-2 border-b border-neutral-200 z-10 shrink-0">
        <ToolButton icon={<Bold className="w-4 h-4" />} onClick={() => execCmd('bold')} title="Bold" />
        <ToolButton icon={<Italic className="w-4 h-4" />} onClick={() => execCmd('italic')} title="Italic" />
        <ToolButton icon={<Underline className="w-4 h-4" />} onClick={() => execCmd('underline')} title="Underline" />
        <ToolButton icon={<Strikethrough className="w-4 h-4" />} onClick={() => execCmd('strikeThrough')} title="Strikethrough" />
        <div className="w-px h-6 bg-neutral-200 mx-1" />
        <ToolButton icon={<Heading1 className="w-4 h-4" />} onClick={() => execCmd('formatBlock', 'H1')} title="Heading 1" />
        <ToolButton icon={<Heading2 className="w-4 h-4" />} onClick={() => execCmd('formatBlock', 'H2')} title="Heading 2" />
        <ToolButton icon={<Heading3 className="w-4 h-4" />} onClick={() => execCmd('formatBlock', 'H3')} title="Heading 3" />
        <ToolButton icon={<Text className="w-4 h-4" />} onClick={() => execCmd('formatBlock', 'P')} title="Paragraph" />
        <div className="w-px h-6 bg-neutral-200 mx-1" />
        <ToolButton icon={<AlignLeft className="w-4 h-4" />} onClick={() => execCmd('justifyLeft')} title="Align Left" />
        <ToolButton icon={<AlignCenter className="w-4 h-4" />} onClick={() => execCmd('justifyCenter')} title="Align Center" />
        <ToolButton icon={<AlignRight className="w-4 h-4" />} onClick={() => execCmd('justifyRight')} title="Align Right" />
        <ToolButton icon={<AlignJustify className="w-4 h-4" />} onClick={() => execCmd('justifyFull')} title="Justify" />
        <div className="w-px h-6 bg-neutral-200 mx-1" />
        <ToolButton icon={<List className="w-4 h-4" />} onClick={() => execCmd('insertUnorderedList')} title="Bullet List" />
        <ToolButton icon={<ListOrdered className="w-4 h-4" />} onClick={() => execCmd('insertOrderedList')} title="Numbered List" />
        <div className="w-px h-6 bg-neutral-200 mx-1" />
        <ToolButton
          icon={<Link className="w-4 h-4" />}
          onClick={() => {
            const url = prompt('Enter a URL:', 'https://')
            if (url) execCmd('createLink', url)
          }}
          title="Insert Link"
        />
      </div>

      {/* Editor Canvas Container (Grey background) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#E5E7EB]">
        {/* The A4 style editor paper */}
        <div
          ref={contentRef}
          className="docx-editor-paper prose prose-neutral max-w-[210mm] w-full min-h-[297mm] bg-white shadow-md outline-none px-12 py-16 mx-auto"
          contentEditable
          style={{ wordBreak: 'break-word' }}
        />
      </div>
      <style>{`
        /* Styling overrides to make it look like a Word Document inside the prose */
        .docx-editor-paper h1 { margin-top: 0.5em; font-family: var(--font-heading); color: var(--color-primary); }
        .docx-editor-paper h2, .docx-editor-paper h3 { font-family: var(--font-heading); }
        .docx-editor-paper p { margin-top: 0.65em; margin-bottom: 0.65em; line-height: 1.6; }
        .docx-editor-paper ul, .docx-editor-paper ol { margin-top: 0.75em; margin-bottom: 0.75em; padding-left: 1.5em; }
        .docx-editor-paper li { margin-top: 0.35em; margin-bottom: 0.35em; line-height: 1.6; }
        .docx-editor-paper li + li { margin-top: 0.5em; }

        /* Keep horizontal rules out of the text — clear gap above and below */
        .docx-editor-paper hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid var(--color-neutral-200);
          background: none;
          height: 0;
        }

        /* Premium custom table rendering */
        .docx-editor-paper table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5em 0;
          font-size: 0.95em;
        }
        .docx-editor-paper table, .docx-editor-paper th, .docx-editor-paper td {
          border: 1px solid var(--color-neutral-300) !important;
        }
        .docx-editor-paper th, .docx-editor-paper td {
          padding: 10px 14px !important;
          text-align: left;
          vertical-align: top;
        }
        .docx-editor-paper th {
          background-color: var(--color-neutral-100) !important;
          font-weight: 600;
          color: var(--color-primary);
        }
        .docx-editor-paper tr:nth-of-type(even) {
          background-color: rgba(244, 242, 238, 0.4) !important;
        }
      `}</style>
    </div>
  )
}

function ToolButton({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 text-neutral-600 hover:text-primary hover:bg-neutral-100 rounded-md transition-colors flex items-center justify-center"
    >
      {icon}
    </button>
  )
}

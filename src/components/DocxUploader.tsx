import { useRef, useState } from 'react'
import mammoth from 'mammoth'
import { UploadCloud, FileText, Loader2 } from 'lucide-react'

type Props = {
  onParsed: (title: string, htmlContent: string) => void
}

export default function DocxUploader({ onParsed }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setError('Please select a valid .docx file.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const title = file.name.replace('.docx', '')
      
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value // The generated HTML
      
      onParsed(title, html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse .docx file.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      void processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors
        ${loading ? 'border-primary/50 bg-neutral-50' : 'border-neutral-300 hover:border-primary hover:bg-neutral-50'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            void processFile(file)
          }
          // Reset input so the same file can be selected again
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />

      <div className="mb-4 rounded-full bg-neutral-100 p-4">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <UploadCloud className="h-8 w-8 text-neutral-500" />
        )}
      </div>

      <h3 className="mb-1 text-lg font-semibold text-neutral-900">
        {loading ? 'Processing document...' : 'Upload a DOCX Document'}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-neutral-600">
        Drag and drop a Microsoft Word (.docx) file here, or click to browse. The document will be parsed into the editor.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
        className="btn-primary flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Browse Files
      </button>

      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}
    </div>
  )
}

import { useRef, useState } from 'react'
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { requireAuthSession } from '../lib/auth'
import { importPropertiesFromExcel, type PropertyImportSummary } from '../lib/import-properties'

type Props = {
  onComplete?: (summary: PropertyImportSummary) => void
}

export default function PropertyExcelImporter({ onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [summary, setSummary] = useState<PropertyImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileName(file?.name ?? null)
    setSummary(null)
    setError(null)
  }

  const runImport = async () => {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError('Choose an Excel file first.')
      return
    }

    setImporting(true)
    setError(null)
    setSummary(null)

    try {
      await requireAuthSession()
      const buffer = await file.arrayBuffer()
      const result = await importPropertiesFromExcel(supabase, buffer)
      setSummary(result)
      onComplete?.(result)
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : 'Import failed.'
      setError(message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="card space-y-4 border-dashed border-neutral-300 bg-neutral-50/60">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-semibold text-primary">Import from Excel</h3>
          <p className="text-sm text-neutral-600">
            Upload a spreadsheet to create or update listings by title. Drive image links become thumbnails; uploaded storage images are kept.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-light"
            onChange={handleFileChange}
            disabled={importing}
          />
        </label>
        <button
          type="button"
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2"
          onClick={() => void runImport()}
          disabled={importing || !fileName}
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>

      {fileName ? <p className="text-xs text-neutral-500">Selected: {fileName}</p> : null}

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>
      ) : null}

      {summary ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <p className="font-semibold text-primary">Import summary</p>
          <ul className="mt-2 space-y-1 text-neutral-700">
            <li>Inserted: {summary.inserted}</li>
            <li>Updated: {summary.updated}</li>
            <li>Skipped (empty title): {summary.skipped}</li>
            <li>Images added: {summary.imagesInserted}</li>
          </ul>
          {summary.failed.length > 0 ? (
            <div className="mt-3 space-y-1">
              <p className="font-medium text-danger">Failed rows</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-danger">
                {summary.failed.map((failure) => (
                  <li key={`${failure.title}-${failure.error}`}>
                    {failure.title}: {failure.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs leading-5 text-neutral-500">
        Expected columns: title, description, type, address, city, area, price, rent_frequency, bedrooms, bathrooms, size,
        amenities, status, bayut_url, external_url, property_finder_url, other_portal_url, image_link_1–4.
        Run migration <code className="text-[11px]">007_properties_title_unique.sql</code> if upsert by title fails.
      </p>
    </div>
  )
}

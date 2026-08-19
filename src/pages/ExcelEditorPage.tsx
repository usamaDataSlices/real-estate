import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Spreadsheet, { type Matrix } from 'react-spreadsheet'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, Loader2, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import ConfirmModal from '../components/ConfirmModal'
import { deleteSpreadsheet, fetchSpreadsheets, saveSpreadsheet } from '../lib/spreadsheets-api'
import { makeId } from '../lib/id'
import { isSupabaseConfigured } from '../lib/supabase'
import type { SavedSpreadsheet, SpreadsheetCell, WorkbookData, WorkbookSheet } from '../types/spreadsheet'
import './excel-editor.css'

const ROWS = 30
const COLUMNS = 12
const DEFAULT_PAGE_SIZE = 100
const emptyCells = (rows = ROWS, columns = COLUMNS): Matrix<SpreadsheetCell> =>
  Array.from({ length: rows }, () => Array.from({ length: columns }, () => ({ value: '' })))

const newWorkbook = (): WorkbookData => {
  const id = makeId()
  return { version: 1, activeSheetId: id, sheets: [{ id, name: 'Sheet1', data: emptyCells() }] }
}

function worksheetToCells(sheet: XLSX.WorkSheet): Matrix<SpreadsheetCell> {
  const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean>>(sheet, { header: 1, raw: true, defval: '' })
  const rowCount = Math.max(rows.length, ROWS)
  const columnCount = Math.max(COLUMNS, ...rows.map((row) => row.length))
  return Array.from({ length: rowCount }, (_, r) => Array.from({ length: columnCount }, (_, c) => {
    const source = sheet[XLSX.utils.encode_cell({ r, c })]
    return { value: source?.f ? `=${source.f}` : rows[r]?.[c] ?? '' }
  }))
}

function cellsToWorksheet(data: Matrix<SpreadsheetCell>) {
  const sheet = XLSX.utils.aoa_to_sheet(data.map((row) => row.map((cell) => cell?.value ?? '')))
  data.forEach((row, r) => row.forEach((cell, c) => {
    if (typeof cell?.value === 'string' && cell.value.startsWith('=')) {
      sheet[XLSX.utils.encode_cell({ r, c })] = { t: 'n', f: cell.value.slice(1) }
    }
  }))
  return sheet
}

function uniqueSheetName(name: string, sheets: WorkbookSheet[], exceptId?: string) {
  const base = (name.trim() || 'Sheet').slice(0, 31)
  let candidate = base
  let number = 2
  while (sheets.some((sheet) => sheet.id !== exceptId && sheet.name.toLowerCase() === candidate.toLowerCase())) {
    const suffix = ` (${number++})`
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`
  }
  return candidate
}

export default function ExcelEditorPage() {
  const queryClient = useQueryClient()
  const [workbook, setWorkbook] = useState<WorkbookData>(() => newWorkbook())
  const [name, setName] = useState('Untitled spreadsheet')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('Loading your spreadsheets…')
  const [deleteTarget, setDeleteTarget] = useState<SavedSpreadsheet | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeIdRef = useRef<string | null>(null)
  const changeVersionRef = useRef(0)
  const savingVersionRef = useRef(0)
  const currentSheet = workbook.sheets.find((sheet) => sheet.id === workbook.activeSheetId) ?? workbook.sheets[0]
  const totalRows = currentSheet?.data.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageStart = safePage * pageSize
  const pageData = currentSheet?.data.slice(pageStart, pageStart + pageSize) ?? []
  const rowLabels = pageData.map((_, index) => String(pageStart + index + 1))

  const listQuery = useQuery({ queryKey: ['spreadsheets'], queryFn: fetchSpreadsheets, enabled: isSupabaseConfigured })
  const savedWorkbooks = useMemo(() => listQuery.data ?? [], [listQuery.data])

  const openWorkbook = (saved: SavedSpreadsheet) => {
    activeIdRef.current = saved.id
    setActiveId(saved.id)
    setName(saved.name)
    setWorkbook(saved.workbook)
    setPage(0)
    changeVersionRef.current = 0
    setSaveState('saved')
    setMessage('All changes saved in Supabase.')
  }

  const createWorkbook = () => {
    const id = makeId()
    activeIdRef.current = id
    setActiveId(id)
    setName('Untitled spreadsheet')
    setWorkbook(newWorkbook())
    setPage(0)
    changeVersionRef.current = 1
    setSaveState('dirty')
    setMessage('New workbook. Autosave is pending…')
  }

  useEffect(() => {
    if (activeIdRef.current || !listQuery.isSuccess) return
    if (savedWorkbooks.length) openWorkbook(savedWorkbooks[0])
    else createWorkbook()
  }, [savedWorkbooks, listQuery.isSuccess])

  const saveMutation = useMutation({
    mutationFn: saveSpreadsheet,
    onSuccess: (saved) => {
      const currentIsSaved = savingVersionRef.current === changeVersionRef.current
      setSaveState(currentIsSaved ? 'saved' : 'dirty')
      setMessage(currentIsSaved ? 'All changes saved in Supabase.' : 'Unsaved changes…')
      queryClient.setQueryData<SavedSpreadsheet[]>(['spreadsheets'], (current = []) => [saved, ...current.filter((item) => item.id !== saved.id)])
    },
    onError: (error) => {
      setSaveState('error')
      setMessage(error instanceof Error ? error.message : 'Autosave failed.')
    },
  })

  useEffect(() => {
    if (saveState !== 'dirty' || !activeId || !isSupabaseConfigured) return
    const timer = window.setTimeout(() => {
      savingVersionRef.current = changeVersionRef.current
      setSaveState('saving')
      saveMutation.mutate({ id: activeId, name, workbook })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [activeId, name, workbook, saveState, saveMutation])

  const changed = () => {
    changeVersionRef.current += 1
    setSaveState('dirty')
    setMessage('Unsaved changes…')
  }

  const updateCurrentSheet = (visibleData: Matrix<SpreadsheetCell>) => {
    setWorkbook((current) => ({
      ...current,
      sheets: current.sheets.map((sheet) => {
        if (sheet.id !== current.activeSheetId) return sheet
        const data = [...sheet.data]
        visibleData.forEach((row, index) => { data[pageStart + index] = row })
        return { ...sheet, data }
      }),
    }))
    changed()
  }

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const source = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheets = source.SheetNames.map((sheetName) => ({ id: makeId(), name: sheetName, data: worksheetToCells(source.Sheets[sheetName]) }))
      if (!sheets.length) throw new Error('The workbook does not contain a worksheet.')
      setWorkbook({ version: 1, activeSheetId: sheets[0].id, sheets })
      setPage(0)
      setName(file.name.replace(/\.(xlsx|xls|csv)$/i, ''))
      changed()
      setMessage(`Imported ${sheets.length} worksheet${sheets.length === 1 ? '' : 's'}. Autosaving…`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not import this file.')
    } finally {
      event.target.value = ''
    }
  }

  const exportFile = () => {
    const output = XLSX.utils.book_new()
    workbook.sheets.forEach((sheet) => XLSX.utils.book_append_sheet(output, cellsToWorksheet(sheet.data), sheet.name))
    XLSX.writeFile(output, `${name.trim() || 'spreadsheet'}.xlsx`)
    setMessage(`Exported all ${workbook.sheets.length} worksheets.`)
  }

  const addSheet = () => {
    const id = makeId()
    setWorkbook((current) => ({ ...current, activeSheetId: id, sheets: [...current.sheets, { id, name: uniqueSheetName(`Sheet${current.sheets.length + 1}`, current.sheets), data: emptyCells() }] }))
    setPage(0)
    changed()
  }

  const renameSheet = (sheet: WorkbookSheet) => {
    const requested = window.prompt('Worksheet name', sheet.name)
    if (requested === null) return
    setWorkbook((current) => ({ ...current, sheets: current.sheets.map((item) => item.id === sheet.id ? { ...item, name: uniqueSheetName(requested, current.sheets, sheet.id) } : item) }))
    changed()
  }

  const removeSheet = (sheetId: string) => {
    if (workbook.sheets.length === 1) return
    setWorkbook((current) => {
      const index = current.sheets.findIndex((sheet) => sheet.id === sheetId)
      const sheets = current.sheets.filter((sheet) => sheet.id !== sheetId)
      const activeSheetId = current.activeSheetId === sheetId ? sheets[Math.max(0, index - 1)].id : current.activeSheetId
      return { ...current, sheets, activeSheetId }
    })
    changed()
  }

  const deleteMutation = useMutation({
    mutationFn: deleteSpreadsheet,
    onSuccess: (_, deletedId) => {
      setDeleteTarget(null)
      queryClient.setQueryData<SavedSpreadsheet[]>(['spreadsheets'], (current = []) => current.filter((item) => item.id !== deletedId))
      if (deletedId === activeId) createWorkbook()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : 'Delete failed.'),
  })

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div><p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-dark">Cloud workspace</p><h1 className="flex items-center gap-3 text-3xl font-heading font-semibold text-primary"><FileSpreadsheet className="h-7 w-7 text-success" /> Excel Editor</h1><p className="mt-1 text-sm text-neutral-600">Multi-sheet workbooks autosave securely to Supabase.</p></div>
        <div className="flex flex-wrap gap-2"><input ref={inputRef} className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={importFile} /><button type="button" className="excel-action" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /> Import</button><button type="button" className="excel-action" onClick={createWorkbook}><Plus className="h-4 w-4" /> New</button><button type="button" className="btn-primary gap-2" onClick={exportFile}><Download className="h-4 w-4" /> Export all sheets</button></div>
      </section>

      {listQuery.isError ? <div className="rounded-xl border border-danger/30 bg-white p-4 text-sm text-danger">Could not load spreadsheets. Apply migration 012_spreadsheets.sql to Supabase.</div> : null}
      <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"><p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Workbooks</p>{listQuery.isLoading ? <Loader2 className="m-3 h-5 w-5 animate-spin text-accent-dark" /> : null}<div className="space-y-1">{savedWorkbooks.map((saved) => <div key={saved.id} className={`group flex items-center rounded-lg ${saved.id === activeId ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}><button type="button" className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm font-medium text-primary" onClick={() => openWorkbook(saved)}>{saved.name}</button><button type="button" aria-label={`Delete ${saved.name}`} className="p-2 text-neutral-400 opacity-0 hover:text-danger group-hover:opacity-100" onClick={() => setDeleteTarget(saved)}><Trash2 className="h-4 w-4" /></button></div>)}</div></aside>
        <section className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><input aria-label="Workbook name" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-primary sm:max-w-sm" value={name} onChange={(event) => { setName(event.target.value); changed() }} /><span className={`flex items-center gap-1 text-xs ${saveState === 'error' ? 'text-danger' : 'text-neutral-500'}`}>{saveState === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{message}</span></div>
          <div className="excel-grid overflow-auto p-4">
            {currentSheet ? <Spreadsheet key={`${currentSheet.id}-${safePage}-${pageSize}`} data={pageData} rowLabels={rowLabels} onChange={updateCurrentSheet} /> : null}
          </div>
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Rows {totalRows ? pageStart + 1 : 0}–{Math.min(pageStart + pageSize, totalRows)} of {totalRows.toLocaleString()}</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">Rows per page
                <select className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0) }}>
                  <option value={50}>50</option><option value={100}>100</option><option value={250}>250</option>
                </select>
              </label>
              <span className="min-w-20 text-center">Page {safePage + 1} of {pageCount}</span>
              <button type="button" className="excel-page-button" aria-label="First page" disabled={safePage === 0} onClick={() => setPage(0)}><ChevronsLeft className="h-4 w-4" /></button>
              <button type="button" className="excel-page-button" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" className="excel-page-button" aria-label="Next page" disabled={safePage >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}><ChevronRight className="h-4 w-4" /></button>
              <button type="button" className="excel-page-button" aria-label="Last page" disabled={safePage >= pageCount - 1} onClick={() => setPage(pageCount - 1)}><ChevronsRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex items-end gap-1 overflow-x-auto border-t border-neutral-200 bg-neutral-50 px-3 pt-2">
            {workbook.sheets.map((sheet) => <div key={sheet.id} className={`group flex shrink-0 items-center rounded-t-lg border border-b-0 ${sheet.id === workbook.activeSheetId ? 'border-neutral-300 bg-white text-primary' : 'border-transparent text-neutral-600 hover:bg-neutral-100'}`}><button type="button" className="px-4 py-2 text-sm font-medium" onClick={() => { setWorkbook((current) => ({ ...current, activeSheetId: sheet.id })); setPage(0) }} onDoubleClick={() => renameSheet(sheet)} title="Double-click to rename">{sheet.name}</button>{workbook.sheets.length > 1 ? <button type="button" className="mr-1 rounded p-1 opacity-0 hover:bg-neutral-200 group-hover:opacity-100" aria-label={`Delete ${sheet.name}`} onClick={() => removeSheet(sheet.id)}><X className="h-3.5 w-3.5" /></button> : null}</div>)}
            <button type="button" className="mb-1 shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-200" onClick={addSheet} aria-label="Add worksheet"><Plus className="h-4 w-4" /></button>
          </div>
        </section>
      </div>
      <ConfirmModal open={Boolean(deleteTarget)} title="Delete workbook?" description={`Delete “${deleteTarget?.name ?? ''}” permanently?`} confirmLabel="Delete" loading={deleteMutation.isPending} onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }} />
    </div>
  )
}

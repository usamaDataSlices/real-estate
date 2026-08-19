import { makeId } from './id'
import { supabase } from './supabase'
import type { SavedSpreadsheet, SpreadsheetData, WorkbookData } from '../types/spreadsheet'

type SpreadsheetRow = {
  id: string
  name: string
  cell_data: WorkbookData | SpreadsheetData
  created_at?: string
  updated_at?: string
}

const SELECT = 'id,name,cell_data,created_at,updated_at'
function normalizeWorkbook(value: WorkbookData | SpreadsheetData): WorkbookData {
  if (!Array.isArray(value) && value?.version === 1 && Array.isArray(value.sheets)) return value
  const id = makeId()
  return { version: 1, activeSheetId: id, sheets: [{ id, name: 'Sheet1', data: Array.isArray(value) ? value : [] }] }
}

const mapRow = (row: SpreadsheetRow): SavedSpreadsheet => ({
  id: row.id,
  name: row.name,
  workbook: normalizeWorkbook(row.cell_data),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function fetchSpreadsheets(): Promise<SavedSpreadsheet[]> {
  const { data, error } = await supabase.from('spreadsheets').select(SELECT).order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => mapRow(row as SpreadsheetRow))
}

export async function saveSpreadsheet(payload: { id?: string; name: string; workbook: WorkbookData }) {
  const id = payload.id ?? makeId()
  const { data, error } = await supabase
    .from('spreadsheets')
    .upsert({ id, name: payload.name.trim() || 'Untitled spreadsheet', cell_data: payload.workbook, updated_at: new Date().toISOString() })
    .select(SELECT)
    .single()
  if (error) throw error
  return mapRow(data as SpreadsheetRow)
}

export async function deleteSpreadsheet(id: string) {
  const { error } = await supabase.from('spreadsheets').delete().eq('id', id)
  if (error) throw error
}

export type SpreadsheetCellValue = string | number | boolean
export type SpreadsheetCell = { value: SpreadsheetCellValue }
export type SpreadsheetData = Array<Array<SpreadsheetCell | undefined>>
export type WorkbookSheet = { id: string; name: string; data: SpreadsheetData }
export type WorkbookData = { version: 1; activeSheetId: string; sheets: WorkbookSheet[] }
export type SavedSpreadsheet = {
  id: string
  name: string
  workbook: WorkbookData
  createdAt?: string
  updatedAt?: string
}

import type { SupabaseClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const DRIVE_FILE_ID_RE = /\/d\/([a-zA-Z0-9_-]+)/
const IMAGE_COLUMNS = ['image_link_1', 'image_link_2', 'image_link_3', 'image_link_4'] as const

const PORTAL_COLUMNS = [
  { column: 'bayut_url', portal: 'bayut' },
  { column: 'property_finder_url', portal: 'property_finder' },
  { column: 'other_portal_url', portal: 'other' },
] as const

export type PropertyImportSummary = {
  inserted: number
  updated: number
  skipped: number
  imagesInserted: number
  failed: { title: string; error: string }[]
}

type NormalizedRow = Record<string, unknown>

type PropertyInsertRow = {
  title: string
  description: string | null
  type: string | null
  address: string | null
  city: string | null
  area: string | null
  price: number | null
  rent_frequency: string | null
  bedrooms: number | null
  bathrooms: number | null
  size: number | null
  amenities: string[]
  status: string
  bayut_url: string | null
  external_url: string | null
  portal_links: { url: string; portal: string }[]
}

function cellValue(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toNumber(value: unknown) {
  const text = cellValue(value)
  if (!text) return null
  const parsed = Number(text.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function toNullableText(value: unknown) {
  const text = cellValue(value)
  return text || null
}

function parseAmenities(value: unknown) {
  const text = cellValue(value)
  if (!text) return []
  return text.split(',').map((item) => item.trim()).filter(Boolean)
}

function normalizeHeaderKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, '_')
}

export function normalizeImportRow(rawRow: Record<string, unknown>): NormalizedRow {
  const row: NormalizedRow = {}
  for (const [key, value] of Object.entries(rawRow)) {
    row[normalizeHeaderKey(key)] = value
  }
  return row
}

function buildPortalLinks(row: NormalizedRow) {
  const links: { url: string; portal: string }[] = []

  for (const { column, portal } of PORTAL_COLUMNS) {
    const url = cellValue(row[column])
    if (url) links.push({ url, portal })
  }

  return links
}

function driveThumbnailUrl(rawUrl: unknown) {
  const url = cellValue(rawUrl)
  if (!url) return null

  const match = url.match(DRIVE_FILE_ID_RE)
  if (!match) return null

  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
}

function buildPropertyRow(row: NormalizedRow): PropertyInsertRow | null {
  const title = cellValue(row.title)
  if (!title) return null

  const portalLinks = buildPortalLinks(row)
  const bayutUrl = cellValue(row.bayut_url) || null
  const externalUrl = cellValue(row.external_url) || cellValue(row.other_portal_url) || null

  return {
    title,
    description: toNullableText(row.description),
    type: toNullableText(row.type),
    address: toNullableText(row.address),
    city: toNullableText(row.city),
    area: toNullableText(row.area),
    price: toNumber(row.price),
    rent_frequency: toNullableText(row.rent_frequency),
    bedrooms: toNumber(row.bedrooms),
    bathrooms: toNumber(row.bathrooms),
    size: toNumber(row.size),
    amenities: parseAmenities(row.amenities),
    status: toNullableText(row.status) ?? 'draft',
    bayut_url: bayutUrl,
    external_url: externalUrl,
    portal_links: portalLinks,
  }
}

function buildImageRows(propertyId: string, row: NormalizedRow) {
  return IMAGE_COLUMNS.flatMap((column, sortOrder) => {
    const thumbnailUrl = driveThumbnailUrl(row[column])
    if (!thumbnailUrl) return []

    return [{
      property_id: propertyId,
      url: thumbnailUrl,
      sort_order: sortOrder,
      is_cover: sortOrder === 0,
      storage_path: null,
    }]
  })
}

export function parsePropertyExcelBuffer(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('No sheets found in workbook.')
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })
}

export async function importPropertiesFromRows(
  supabase: SupabaseClient,
  rawRows: Record<string, unknown>[],
): Promise<PropertyImportSummary> {
  const stats: PropertyImportSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    imagesInserted: 0,
    failed: [],
  }

  for (const rawRow of rawRows) {
    const row = normalizeImportRow(rawRow)
    const propertyRow = buildPropertyRow(row)

    if (!propertyRow) {
      stats.skipped += 1
      continue
    }

    try {
      const { data: existing, error: existingError } = await supabase
        .from('properties')
        .select('id')
        .eq('title', propertyRow.title)
        .maybeSingle()

      if (existingError) throw existingError

      const { data: savedProperty, error: upsertError } = await supabase
        .from('properties')
        .upsert(propertyRow, { onConflict: 'title' })
        .select('id')
        .single()

      if (upsertError) throw upsertError

      if (existing) stats.updated += 1
      else stats.inserted += 1

      const propertyId = savedProperty.id as string

      const { error: deleteImagesError } = await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId)
        .is('storage_path', null)

      if (deleteImagesError) throw deleteImagesError

      const imageRows = buildImageRows(propertyId, row)
      if (imageRows.length > 0) {
        const { error: insertImagesError } = await supabase.from('property_images').insert(imageRows)
        if (insertImagesError) throw insertImagesError
        stats.imagesInserted += imageRows.length
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      stats.failed.push({ title: propertyRow.title, error: message })
    }
  }

  return stats
}

export async function importPropertiesFromExcel(
  supabase: SupabaseClient,
  buffer: ArrayBuffer,
): Promise<PropertyImportSummary> {
  const rows = parsePropertyExcelBuffer(buffer)
  return importPropertiesFromRows(supabase, rows)
}

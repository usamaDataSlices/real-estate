#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

dotenv.config()

const DRIVE_FILE_ID_RE = /\/d\/([a-zA-Z0-9_-]+)/
const IMAGE_COLUMNS = ['image_link_1', 'image_link_2', 'image_link_3', 'image_link_4']

const PORTAL_COLUMNS = [
  { column: 'bayut_url', portal: 'bayut' },
  { column: 'property_finder_url', portal: 'property_finder' },
  { column: 'other_portal_url', portal: 'other' },
]

function usage() {
  console.error('Usage: node scripts/import-properties.js <path-to-xlsx>')
}

function cellValue(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toNumber(value) {
  const text = cellValue(value)
  if (!text) return null
  const parsed = Number(text.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function toNullableText(value) {
  const text = cellValue(value)
  return text || null
}

function parseAmenities(value) {
  const text = cellValue(value)
  if (!text) return []
  return text.split(',').map((item) => item.trim()).filter(Boolean)
}

function buildPortalLinks(row) {
  const links = []

  for (const { column, portal } of PORTAL_COLUMNS) {
    const url = cellValue(row[column])
    if (url) links.push({ url, portal })
  }

  return links
}

function driveThumbnailUrl(rawUrl) {
  const url = cellValue(rawUrl)
  if (!url) return null

  const match = url.match(DRIVE_FILE_ID_RE)
  if (!match) return null

  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
}

function normalizeHeaderKey(key) {
  return String(key).trim().toLowerCase().replace(/\s+/g, '_')
}

function normalizeRow(rawRow) {
  const row = {}
  for (const [key, value] of Object.entries(rawRow)) {
    row[normalizeHeaderKey(key)] = value
  }
  return row
}

function buildPropertyRow(row) {
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

function buildImageRows(propertyId, row) {
  const images = []

  IMAGE_COLUMNS.forEach((column, sortOrder) => {
    const thumbnailUrl = driveThumbnailUrl(row[column])
    if (!thumbnailUrl) return

    images.push({
      property_id: propertyId,
      url: thumbnailUrl,
      sort_order: sortOrder,
      is_cover: sortOrder === 0,
      storage_path: null,
    })
  })

  return images
}

async function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    usage()
    process.exit(1)
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const workbook = XLSX.read(readFileSync(resolve(inputPath)), { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    console.error('No sheets found in workbook.')
    process.exit(1)
  }

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
  const stats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    imagesInserted: 0,
    failed: [],
  }

  for (const rawRow of rawRows) {
    const row = normalizeRow(rawRow)
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

      const propertyId = savedProperty.id

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

  console.log('\nImport summary')
  console.log('----------------')
  console.log(`Properties inserted: ${stats.inserted}`)
  console.log(`Properties updated:  ${stats.updated}`)
  console.log(`Rows skipped:        ${stats.skipped} (empty title)`)
  console.log(`Images inserted:     ${stats.imagesInserted}`)

  if (stats.failed.length > 0) {
    console.log(`\nFailed rows (${stats.failed.length}):`)
    for (const failure of stats.failed) {
      console.log(`- ${failure.title}: ${failure.error}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { importPropertiesFromRows, parsePropertyExcelBuffer } from '../src/lib/import-properties.ts'

dotenv.config()

function usage() {
  console.error('Usage: npm run import:properties -- <path-to-xlsx>')
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

  const buffer = readFileSync(resolve(inputPath))
  const rows = parsePropertyExcelBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
  const stats = await importPropertiesFromRows(supabase, rows)

  console.log('\nImport summary')
  console.log('----------------')
  console.log(`Properties inserted: ${stats.inserted}`)
  console.log(`Properties updated:  ${stats.updated}`)
  console.log(`Rows skipped:        ${stats.skipped} (empty title)`)

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

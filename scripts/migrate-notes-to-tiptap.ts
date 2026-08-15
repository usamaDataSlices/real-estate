/**
 * Converts legacy plain-text notes to Tiptap JSON + content_plain.
 * Run after 009_notes_rich_text.sql if the SQL migration did not cover all rows.
 *
 * Usage: npx tsx scripts/migrate-notes-to-tiptap.ts
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { plaintextToTiptapDoc, tiptapJsonToPlaintext } from '../src/lib/tiptap/content'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const { data: notes, error } = await supabase.from('notes').select('id,title,body,content_json,content_plain')

  if (error) throw error

  let migrated = 0
  for (const note of notes ?? []) {
    const needsMigration = !note.content_json || (note.body && !note.content_plain)
    if (!needsMigration) continue

    const plain = note.content_plain || note.body || ''
    const contentJson = note.content_json ?? plaintextToTiptapDoc(plain)
    const contentPlain = tiptapJsonToPlaintext(contentJson) || plain

    const { error: updateError } = await supabase
      .from('notes')
      .update({
        content_json: contentJson,
        content_plain: contentPlain,
        body: contentPlain,
        updated_at: new Date().toISOString(),
      })
      .eq('id', note.id)

    if (updateError) throw updateError
    migrated += 1
    console.log(`Migrated note ${note.id} (${note.title})`)
  }

  console.log(`Done. Migrated ${migrated} note(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

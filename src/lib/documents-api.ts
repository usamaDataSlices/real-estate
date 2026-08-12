import type { PropertyDocument } from '../types/document'
import { makeId } from './id'
import { supabase } from './supabase'

export async function fetchDocuments(): Promise<PropertyDocument[]> {
  const { data, error } = await supabase
    .from('property_documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((doc) => ({
    id: doc.id,
    propertyId: doc.property_id,
    title: doc.title,
    content: doc.content,
    fileUrl: doc.file_url,
    storagePath: doc.storage_path,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }))
}

export async function upsertDocument(payload: {
  id?: string
  propertyId: string
  title: string
  content: string
}) {
  if (!payload.propertyId) {
    throw new Error('Select a property before saving this document.')
  }

  const docId = payload.id ?? makeId()
  const { error } = await supabase.from('property_documents').upsert({
    id: docId,
    property_id: payload.propertyId,
    title: payload.title,
    content: payload.content,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  return docId
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from('property_documents').delete().eq('id', id)
  if (error) throw error
}

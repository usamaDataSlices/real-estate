import type { Ticket, TicketAttachment, TicketPriority, TicketStatus, TicketType } from '../types/ticket'
import { makeId } from './id'
import { supabase } from './supabase'
import { TICKET_ATTACHMENT_BUCKET } from './ticket-uploads'

function mapTicket(row: {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  assignee: string
  labels: string[]
  created_at?: string
  updated_at?: string
  ticket_attachments?: { count: number }[]
}): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    type: row.type,
    assignee: row.assignee,
    labels: row.labels ?? [],
    attachmentCount: row.ticket_attachments?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAttachment(row: {
  id: string
  ticket_id: string
  user_id: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  created_at?: string
}): TicketAttachment {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    userId: row.user_id,
    filePath: row.file_path,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  }
}

const TICKET_SELECT =
  'id,title,description,status,priority,type,assignee,labels,created_at,updated_at,ticket_attachments(count)'

export async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapTicket)
}

export async function fetchTicketById(id: string): Promise<Ticket> {
  const { data, error } = await supabase.from('tickets').select(TICKET_SELECT).eq('id', id).single()
  if (error) throw error
  return mapTicket(data)
}

export async function upsertTicket(payload: {
  id?: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  assignee: string
  labels: string[]
}) {
  const title = payload.title.trim()
  if (!title) throw new Error('Ticket title is required.')

  const id = payload.id ?? makeId()
  const updatedAt = new Date().toISOString()

  const { error } = await supabase.from('tickets').upsert({
    id,
    title,
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    type: payload.type,
    assignee: payload.assignee.trim(),
    labels: payload.labels,
    updated_at: updatedAt,
  })

  if (error) throw error
  return fetchTicketById(id)
}

export async function deleteTicket(id: string) {
  const attachments = await fetchTicketAttachments(id)
  if (attachments.length > 0) {
    const paths = attachments.map((item) => item.filePath)
    const { error: storageError } = await supabase.storage.from(TICKET_ATTACHMENT_BUCKET).remove(paths)
    if (storageError) throw storageError
  }

  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTicketAttachments(ticketId: string): Promise<TicketAttachment[]> {
  const { data, error } = await supabase
    .from('ticket_attachments')
    .select('id,ticket_id,user_id,file_path,file_name,file_type,file_size,created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapAttachment)
}

export async function deleteTicketAttachment(id: string, filePath: string) {
  const { error: storageError } = await supabase.storage.from(TICKET_ATTACHMENT_BUCKET).remove([filePath])
  if (storageError) throw storageError

  const { error } = await supabase.from('ticket_attachments').delete().eq('id', id)
  if (error) throw error
}

export async function createSignedTicketAttachmentUrl(filePath: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(TICKET_ATTACHMENT_BUCKET).createSignedUrl(filePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export type TicketStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TicketPriority = 'lowest' | 'low' | 'medium' | 'high' | 'urgent'
export type TicketType = 'task' | 'bug' | 'story' | 'improvement'

export type Ticket = {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  assignee: string
  labels: string[]
  attachmentCount?: number
  createdAt?: string
  updatedAt?: string
}

export type TicketAttachment = {
  id: string
  ticketId: string
  userId: string
  filePath: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt?: string
}

export type TicketFormValues = {
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  assignee: string
  labels: string
}

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'lowest', label: 'Lowest' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'story', label: 'Story' },
  { value: 'improvement', label: 'Improvement' },
]

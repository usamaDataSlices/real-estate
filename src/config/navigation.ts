import { Building2, CalendarDays, FileSpreadsheet, Home, KeyRound, Shield, StickyNote, Ticket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const mainNavItems: NavItem[] = [
  {
    label: 'Browse Properties',
    to: '/',
    icon: Home,
    end: true,
  },
  {
    label: 'Bookings',
    to: '/bookings',
    icon: CalendarDays,
  },
  {
    label: 'Notes',
    to: '/notes',
    icon: StickyNote,
  },
  {
    label: 'Credentials',
    to: '/credentials',
    icon: KeyRound,
  },
  {
    label: 'Tickets',
    to: '/tickets',
    icon: Ticket,
  },
  {
    label: 'Excel Editor',
    to: '/excel',
    icon: FileSpreadsheet,
  },
  {
    label: 'Admin Portal',
    to: '/admin',
    icon: Shield,
  },
]

export const footerNavItems: NavItem[] = [
  {
    label: 'Residential Search',
    to: '/',
    icon: Building2,
    end: true,
  },
  {
    label: 'Broker Admin Console',
    to: '/admin',
    icon: Shield,
  },
]

import type { Listing, PortalLink } from '../types/listing'

export const PORTAL_OPTIONS = [
  { value: 'bayut', label: 'Bayut' },
  { value: 'dubizzle', label: 'Dubizzle' },
  { value: 'property_finder', label: 'Property Finder' },
  { value: 'other', label: 'Other' },
] as const

export function portalDisplayName(portal: string) {
  switch (portal) {
    case 'bayut':
      return 'Bayut'
    case 'dubizzle':
      return 'Dubizzle'
    case 'property_finder':
      return 'Property Finder'
    default:
      return 'Other'
  }
}

export function portalButtonLabel(portal: string) {
  switch (portal) {
    case 'bayut':
      return 'View on Bayut'
    case 'dubizzle':
      return 'View on Dubizzle'
    case 'property_finder':
      return 'View on Property Finder'
    default:
      return 'View Listing'
  }
}

export function resolvePortalLinks(listing: Pick<Listing, 'portalLinks' | 'bayutUrl' | 'externalUrl'>): PortalLink[] {
  const fromPortalLinks = (listing.portalLinks ?? []).filter((link) => link.url?.trim())
  if (fromPortalLinks.length > 0) return fromPortalLinks

  const legacy: PortalLink[] = []
  if (listing.bayutUrl?.trim()) {
    legacy.push({ portal: 'bayut', url: listing.bayutUrl.trim() })
  }
  if (listing.externalUrl?.trim()) {
    legacy.push({ portal: 'other', url: listing.externalUrl.trim() })
  }
  return legacy
}

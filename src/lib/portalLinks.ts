import type { Listing, PortalLink } from '../types/listing'

export const KNOWN_PORTALS = ['bayut', 'dubizzle', 'property_finder'] as const
export type KnownPortal = (typeof KNOWN_PORTALS)[number]

export const PORTAL_OPTIONS = [
  { value: 'bayut', label: 'Bayut' },
  { value: 'dubizzle', label: 'Dubizzle' },
  { value: 'property_finder', label: 'Property Finder' },
  { value: 'custom', label: 'Custom' },
] as const

export function isKnownPortal(portal: string): portal is KnownPortal {
  return (KNOWN_PORTALS as readonly string[]).includes(portal)
}

export function portalDisplayName(portal: string) {
  switch (portal) {
    case 'bayut':
      return 'Bayut'
    case 'dubizzle':
      return 'Dubizzle'
    case 'property_finder':
      return 'Property Finder'
    case 'other':
      return 'Other'
    default:
      return portal
  }
}

export function portalButtonLabel(portal: string) {
  if (isKnownPortal(portal)) {
    return `View on ${portalDisplayName(portal)}`
  }
  if (portal === 'other') {
    return 'View Listing'
  }
  return `View on ${portal}`
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

export function portalLinkToFormValues(link: PortalLink) {
  if (isKnownPortal(link.portal)) {
    return { portalKind: link.portal, customPortalName: '', url: link.url }
  }
  return {
    portalKind: 'custom' as const,
    customPortalName: link.portal === 'other' ? '' : link.portal,
    url: link.url,
  }
}

export function formValuesToPortalLink(values: {
  portalKind: string
  customPortalName?: string
  url: string
}): PortalLink | null {
  const url = values.url.trim()
  if (!url) return null

  if (values.portalKind === 'custom') {
    const name = values.customPortalName?.trim()
    if (!name) return null
    return { portal: name, url }
  }

  if (isKnownPortal(values.portalKind)) {
    return { portal: values.portalKind, url }
  }

  return null
}

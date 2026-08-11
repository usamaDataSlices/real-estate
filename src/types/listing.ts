export type ListingStatus = 'draft' | 'published'

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'studio'
  | 'office'
  | 'townhouse'
  | 'penthouse'

export type PortalLink = {
  portal: 'bayut' | 'dubizzle' | 'property_finder' | string
  url: string
}

export type Listing = {
  id: string
  title: string
  description: string
  type: PropertyType
  address: string
  city: string
  area: string
  price: number
  rentFrequency?: 'monthly' | 'yearly' | null
  bedrooms: number
  bathrooms: number
  size: number
  amenities: string[]
  status: ListingStatus
  portalLinks: PortalLink[]
  /** @deprecated Prefer portalLinks; kept for legacy rows until columns are dropped */
  bayutUrl?: string | null
  /** @deprecated Prefer portalLinks; kept for legacy rows until columns are dropped */
  externalUrl?: string | null
  images: ListingImage[]
}

export type ListingImage = {
  id: string
  url: string
  sortOrder: number
  isCover: boolean
  storagePath?: string | null
}

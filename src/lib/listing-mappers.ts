import type { Listing, ListingImage, PortalLink } from '../types/listing'

type PropertyRow = {
  id: string
  title: string
  description: string | null
  type: Listing['type'] | null
  address: string | null
  city: string | null
  area: string | null
  price: number | null
  rent_frequency: Listing['rentFrequency'] | null
  bedrooms: number | null
  bathrooms: number | null
  size: number | null
  amenities: string[] | null
  status: Listing['status'] | null
  portal_links?: PortalLink[] | null
  bayut_url: string | null
  external_url: string | null
  property_images?: PropertyImageRow[] | null
}

type PropertyImageRow = {
  id: string
  property_id: string
  url: string
  storage_path: string | null
  sort_order: number | null
  is_cover: boolean | null
}

function mapPortalLinks(value: unknown): PortalLink[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is PortalLink => {
      if (!item || typeof item !== 'object') return false
      const portal = (item as PortalLink).portal
      const url = (item as PortalLink).url
      return typeof portal === 'string' && typeof url === 'string'
    })
    .map((item) => ({
      portal: item.portal,
      url: item.url,
    }))
}

export function propertyRowToListing(row: PropertyRow, imagesInput: PropertyImageRow[] = []): Listing {
  const images = imagesInput
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map<ListingImage>((image) => ({
      id: image.id,
      url: image.url,
      sortOrder: image.sort_order ?? 0,
      isCover: Boolean(image.is_cover),
      storagePath: image.storage_path,
    }))

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    type: row.type ?? 'apartment',
    address: row.address ?? '',
    city: row.city ?? '',
    area: row.area ?? '',
    price: row.price ?? 0,
    rentFrequency: row.rent_frequency ?? null,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    size: row.size ?? 0,
    amenities: row.amenities ?? [],
    status: row.status ?? 'draft',
    portalLinks: mapPortalLinks(row.portal_links),
    bayutUrl: row.bayut_url,
    externalUrl: row.external_url,
    images,
  }
}

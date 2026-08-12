import type { AdminListingSubmitPayload } from '../components/AdminListingForm'
import type { Listing, ListingStatus } from '../types/listing'
import { propertyRowToListing } from './listing-mappers'
import { supabase } from './supabase'

export const PROPERTY_SELECT =
  'id,title,description,type,address,city,area,price,rent_frequency,bedrooms,bathrooms,size,amenities,status,portal_links,bayut_url,external_url,created_at'

const IMAGE_SELECT = 'id,property_id,url,storage_path,sort_order,is_cover'

type PropertyImageRow = {
  property_id: string
  id: string
  url: string
  storage_path: string | null
  sort_order: number | null
  is_cover: boolean | null
}

function groupImagesByPropertyId(images: PropertyImageRow[]) {
  const grouped = new Map<string, PropertyImageRow[]>()
  for (const image of images) {
    const current = grouped.get(image.property_id) ?? []
    current.push(image)
    grouped.set(image.property_id, current)
  }
  return grouped
}

export async function fetchListingsWithImages(options?: { publishedOnly?: boolean }) {
  let query = supabase.from('properties').select(PROPERTY_SELECT).order('created_at', { ascending: false })

  if (options?.publishedOnly) {
    query = query.eq('status', 'published')
  }

  const { data: properties, error: propertiesError } = await query
  if (propertiesError) throw propertiesError

  const propertyIds = (properties ?? []).map((property) => property.id)
  if (propertyIds.length === 0) return []

  const { data: images, error: imagesError } = await supabase
    .from('property_images')
    .select(IMAGE_SELECT)
    .in('property_id', propertyIds)
    .order('sort_order', { ascending: true })

  if (imagesError) throw imagesError

  const groupedImages = groupImagesByPropertyId(images ?? [])
  return (properties ?? []).map((property) => propertyRowToListing(property, groupedImages.get(property.id) ?? []))
}

export function listingFromFormValues(id: string, values: AdminListingSubmitPayload): Listing {
  return {
    id,
    title: values.title,
    description: values.description,
    type: values.type,
    address: values.address,
    city: values.city,
    area: values.area,
    price: values.price,
    rentFrequency: values.rentFrequency === '' ? null : (values.rentFrequency as Listing['rentFrequency']),
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    size: values.size,
    amenities: values.amenities ? values.amenities.split(',').map((item) => item.trim()).filter(Boolean) : [],
    status: values.status as ListingStatus,
    portalLinks: values.portalLinks,
    images: values.images,
  }
}

export async function upsertListing(listing: Listing) {
  const { data: existingImages, error: existingImagesError } = await supabase
    .from('property_images')
    .select('storage_path')
    .eq('property_id', listing.id)

  if (existingImagesError) throw existingImagesError

  const propertyPayload = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    type: listing.type,
    address: listing.address,
    city: listing.city,
    area: listing.area,
    price: listing.price,
    rent_frequency: listing.rentFrequency,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    size: listing.size,
    amenities: listing.amenities,
    status: listing.status,
    portal_links: listing.portalLinks,
  }

  const { error: propertyError } = await supabase.from('properties').upsert(propertyPayload)
  if (propertyError) throw propertyError

  const { error: deleteImagesError } = await supabase.from('property_images').delete().eq('property_id', listing.id)
  if (deleteImagesError) throw deleteImagesError

  const removedStoragePaths = (existingImages ?? [])
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path))

  if (removedStoragePaths.length) {
    const { error: storageDeleteError } = await supabase.storage.from('property-images').remove(removedStoragePaths)
    if (storageDeleteError) throw storageDeleteError
  }

  if (listing.images.length > 0) {
    const imageRows = listing.images.map((image) => ({
      id: image.id,
      property_id: listing.id,
      url: image.url,
      storage_path: image.storagePath ?? null,
      sort_order: image.sortOrder,
      is_cover: image.isCover,
    }))
    const { error: insertImagesError } = await supabase.from('property_images').insert(imageRows)
    if (insertImagesError) throw insertImagesError
  }
}

export async function deleteListingWithImages(id: string) {
  const { data: imageRows, error: imageRowsError } = await supabase
    .from('property_images')
    .select('storage_path')
    .eq('property_id', id)

  if (imageRowsError) throw imageRowsError

  const storagePaths = (imageRows ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path))

  if (storagePaths.length) {
    const { error: storageDeleteError } = await supabase.storage.from('property-images').remove(storagePaths)
    if (storageDeleteError) throw storageDeleteError
  }

  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

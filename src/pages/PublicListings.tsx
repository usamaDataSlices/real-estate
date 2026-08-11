import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ListingCard from '../components/ListingCard'
import ListingFilters from '../components/ListingFilters'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { propertyRowToListing } from '../lib/listing-mappers'

type Filters = {
  search: string
  city: string
  type: string
  minPrice: string
  maxPrice: string
  bedrooms: string
}

const initialFilters: Filters = {
  search: '',
  city: '',
  type: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
}

export default function PublicListings() {
  const [filters, setFilters] = useState<Filters>(initialFilters)

  const { data: remoteListings, isLoading, error } = useQuery({
    queryKey: ['public-listings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return []

      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id,title,description,type,address,city,area,price,rent_frequency,bedrooms,bathrooms,size,amenities,status,portal_links,bayut_url,external_url,created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (propertiesError) throw propertiesError

      const propertyIds = (properties ?? []).map((property) => property.id)
      if (propertyIds.length === 0) return []

      const { data: images, error: imagesError } = await supabase
        .from('property_images')
        .select('id,property_id,url,storage_path,sort_order,is_cover')
        .in('property_id', propertyIds)
        .order('sort_order', { ascending: true })

      if (imagesError) throw imagesError

      const groupedImages = new Map<string, typeof images>()
      for (const image of images ?? []) {
        const current = groupedImages.get(image.property_id) ?? []
        current.push(image)
        groupedImages.set(image.property_id, current)
      }

      return (properties ?? []).map((property) => propertyRowToListing(property, groupedImages.get(property.id) ?? []))
    },
  })

  const listings = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const city = filters.city.trim().toLowerCase()
    const minPrice = Number(filters.minPrice || 0)
    const maxPrice = Number(filters.maxPrice || Number.POSITIVE_INFINITY)
    const bedrooms = filters.bedrooms === '' ? null : Number(filters.bedrooms)

    return (remoteListings ?? []).filter((listing) => {
      const matchesSearch =
        !search ||
        listing.title.toLowerCase().includes(search) ||
        listing.address.toLowerCase().includes(search) ||
        listing.area.toLowerCase().includes(search)
      const matchesCity = !city || listing.city.toLowerCase().includes(city)
      const matchesType = !filters.type || listing.type === filters.type
      const matchesMin = listing.price >= minPrice
      const matchesMax = listing.price <= maxPrice
      const matchesBedrooms = bedrooms === null || listing.bedrooms >= bedrooms

      return matchesSearch && matchesCity && matchesType && matchesMin && matchesMax && matchesBedrooms
    })
  }, [filters, remoteListings])

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-dark">Featured Properties</p>
        <h1 className="text-4xl font-heading font-semibold text-neutral-900">Browse properties for sale and rent</h1>
        <p className="max-w-3xl text-neutral-600">
          Search listings by location, price, property type, and bedroom count. Each listing can link out to Bayut or any external portal.
        </p>
      </section>

      <ListingFilters value={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="card text-neutral-600">Loading listings...</div>
      ) : error ? (
        <div className="card text-danger">Failed to load listings from Supabase.</div>
      ) : null}

      {listings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-neutral-600">No listings match the selected filters.</p>
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ListingTable from '../components/ListingTable'
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
    <div className="space-y-12">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-900 py-24 px-6 sm:px-12 text-center shadow-xl">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80" 
            alt="Luxury Villa Background" 
            className="h-full w-full object-cover opacity-45 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-neutral-950/60" />
        </div>

        <div className="relative mx-auto max-w-3xl space-y-6">
          <span className="inline-flex items-center rounded-full bg-accent/25 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-light backdrop-blur-md">
            ✨ Premium Rental Collection
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading tracking-tight text-white leading-tight">
            Find Your Signature Rental
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-200/90 leading-relaxed font-sans font-light">
            A curated portfolio of high-end apartments, boutique villas, and executive office spaces for lease in Dubai's premier communities.
          </p>
        </div>
      </section>

      {/* Main Listings Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold font-heading text-neutral-900 border-l-4 border-accent pl-3">
            Explore Rentals
          </h2>
          <p className="text-sm text-neutral-600">
            Refine your lease search by location, property layouts, and pricing brackets.
          </p>
        </div>

        <ListingFilters value={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-neutral-200/50">
              <svg className="animate-spin h-5 w-5 text-accent-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-neutral-600 font-medium">Curating properties...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center text-danger font-semibold">
            Failed to connect to the properties roster. Please verify connection credentials.
          </div>
        ) : null}

        {listings.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200/50 pb-2">
              <p className="text-sm font-semibold tracking-wide text-neutral-600 uppercase">
                {listings.length} Property Match{listings.length === 1 ? '' : 'es'}
              </p>
            </div>
            <ListingTable listings={listings} />
          </div>
        ) : !isLoading && !error ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-12 text-center shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="mx-auto h-12 w-12 text-neutral-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3-1.091V21M1.2 9l4.243-1.657a2.185 2.185 0 0 1 2.529 1.123L10 13.382V21" />
            </svg>
            <p className="mt-4 font-semibold text-neutral-800">No properties matching filters</p>
            <p className="mt-1 text-sm text-neutral-600">Try adjusting your pricing limits or location criteria.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ListingTable from '../components/ListingTable'
import ListingFilters from '../components/ListingFilters'
import { fetchListingsWithImages } from '../lib/listings-api'
import { isSupabaseConfigured } from '../lib/supabase'

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
    queryFn: () => fetchListingsWithImages({ publishedOnly: true }),
    enabled: isSupabaseConfigured,
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
      <section className="relative overflow-hidden rounded-3xl bg-neutral-900 px-6 py-16 text-center shadow-xl sm:px-8">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
            alt="Luxury Villa Background"
            className="h-full w-full object-cover opacity-45 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-neutral-950/60" />
        </div>

        <div className="relative mx-auto max-w-3xl space-y-4">
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

      <div className="space-y-4">
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
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-neutral-200/50">
              <span className="text-neutral-600 font-medium">Curating properties...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-center font-semibold text-danger">
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
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 text-center shadow-xs">
            <p className="font-semibold text-neutral-800">No properties matching filters</p>
            <p className="mt-1 text-sm text-neutral-600">Try adjusting your pricing limits or location criteria.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

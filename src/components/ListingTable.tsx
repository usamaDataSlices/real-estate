import { Link } from 'react-router-dom'
import type { Listing } from '../types/listing'
import { getListingFallbackImage } from '../lib/listingFallbackImage'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(price)
}

function getCoverImage(listing: Listing) {
  const cover = listing.images
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((image) => image.isCover) ?? listing.images[0]
  return cover?.url ?? getListingFallbackImage(listing.title)
}

export default function ListingTable({ listings }: { listings: Listing[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-100/60 text-xs font-bold uppercase tracking-wider text-neutral-600">
              <th className="px-6 py-4">Property</th>
              <th className="hidden px-6 py-4 md:table-cell">Type</th>
              <th className="hidden px-6 py-4 lg:table-cell">Specifications</th>
              <th className="hidden px-6 py-4 xl:table-cell">Size</th>
              <th className="px-6 py-4">Rent Rate</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60">
            {listings.map((listing) => {
              const coverUrl = getCoverImage(listing)
              const rentFreq = listing.rentFrequency || 'yearly' // Default to yearly for rental look
              
              return (
                <tr 
                  key={listing.id} 
                  className="group transition-colors duration-150 hover:bg-neutral-50/50"
                >
                  {/* Property Info Col */}
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-4 min-w-[280px]">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200/50 bg-neutral-100">
                        <img
                          src={coverUrl}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link 
                          to={`/property/${listing.id}`} 
                          className="font-bold text-neutral-900 group-hover:text-primary transition-colors line-clamp-1"
                        >
                          {listing.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 text-accent-dark">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          <span>{listing.area}, {listing.city}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Property Type Col */}
                  <td className="hidden px-6 py-4.5 md:table-cell">
                    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-neutral-600 border border-neutral-200/40">
                      {listing.type}
                    </span>
                  </td>

                  {/* Specifications Col */}
                  <td className="hidden px-6 py-4.5 text-neutral-600 lg:table-cell">
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18V8.25A2.25 2.25 0 0 1 4.5 6h15a2.25 2.25 0 0 1 2.25 2.25V18M2.25 13.5h19.5M2.25 18h19.5m-16.5-4.5V9a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 9v4.5" />
                        </svg>
                        {listing.bedrooms} Beds
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25v-2.625c0-1.036-.84-1.875-1.875-1.875H5.625c-1.036 0-1.875.84-1.875 1.875v2.625M3.75 14.25h16.5M3.75 14.25v3.375c0 .621.504 1.125 1.125 1.125h15c.621 0 1.125-.504 1.125-1.125V14.25M6 7.5h12M12 4.5c.621 0 1.125-.504 1.125-1.125V3h-2.25v.375c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                        {listing.bathrooms} Baths
                      </span>
                    </div>
                  </td>

                  {/* Size Col */}
                  <td className="hidden px-6 py-4.5 font-medium text-neutral-600 xl:table-cell">
                    {listing.size.toLocaleString()} sqft
                  </td>

                  {/* expected Rental price Col */}
                  <td className="px-6 py-4.5 font-bold text-accent-dark font-sans text-base">
                    <div className="flex flex-col">
                      <span>{formatPrice(listing.price)}</span>
                      <span className="text-2xs font-semibold text-neutral-600 uppercase tracking-wider mt-0.5">
                        {rentFreq} lease
                      </span>
                    </div>
                  </td>

                  {/* Action Col */}
                  <td className="px-6 py-4.5 text-right">
                    <Link 
                      to={`/property/${listing.id}`} 
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-1.5 text-xs font-bold text-neutral-900 transition-all hover:bg-neutral-50 hover:border-accent"
                    >
                      <span>Explore</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

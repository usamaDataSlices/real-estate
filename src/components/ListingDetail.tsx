import type { Listing } from '../types/listing'
import ListingGallery from './ListingGallery'
import { portalDisplayName, resolvePortalLinks } from '../lib/portalLinks'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatPortalHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function ListingDetail({ listing }: { listing: Listing }) {
  const portalLinks = resolvePortalLinks(listing)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div>
        <ListingGallery images={listing.images.map((image) => ({ url: image.url, alt: listing.title }))} />
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm text-neutral-600">{listing.city} · {listing.area}</p>
            <h1 className="text-3xl font-heading font-semibold text-neutral-900">{listing.title}</h1>
          </div>
          <p className="text-neutral-600 leading-7">{listing.description}</p>
        </div>

        {portalLinks.length > 0 ? (
          <section className="mt-8 space-y-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent-dark">External listings</p>
              <h2 className="text-xl font-heading font-semibold text-neutral-900">View on other portals</h2>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="hidden border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-600 sm:grid sm:grid-cols-[minmax(0,180px)_1fr_auto] sm:gap-4">
                <span>Portal</span>
                <span>Link</span>
                <span className="text-right">Action</span>
              </div>

              <ul className="divide-y divide-neutral-200">
                {portalLinks.map((link) => (
                  <li
                    key={`${link.portal}-${link.url}`}
                    className="grid gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 sm:grid-cols-[minmax(0,180px)_1fr_auto] sm:items-center sm:gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {portalDisplayName(link.portal).slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">{portalDisplayName(link.portal)}</p>
                        <p className="text-xs text-neutral-600 sm:hidden">{formatPortalHost(link.url)}</p>
                      </div>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden truncate text-sm text-primary hover:underline sm:block"
                    >
                      {formatPortalHost(link.url)}
                    </a>

                    <div className="sm:text-right">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-primary hover:text-primary sm:w-auto"
                      >
                        View
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="card space-y-6 h-fit bg-white border border-neutral-200/60 p-6 rounded-2xl shadow-xs">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">Asking Price</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-accent-dark font-sans">{formatPrice(listing.price)}</span>
            {listing.rentFrequency ? (
              <span className="text-sm font-semibold text-neutral-600 uppercase">/{listing.rentFrequency}</span>
            ) : null}
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-b border-neutral-100 py-5 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21V9M19.5 9v12m0-12v12m-6-12v12M7.5 9v12M3 9v12M13.5 3h3a1.5 1.5 0 0 1 1.5 1.5V9M3 9h18" />
              </svg>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-neutral-600">Type</p>
              <p className="font-bold text-neutral-900 capitalize">{listing.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18V8.25A2.25 2.25 0 0 1 4.5 6h15a2.25 2.25 0 0 1 2.25 2.25V18M2.25 13.5h19.5M2.25 18h19.5m-16.5-4.5V9a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 9v4.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-neutral-600">Bedrooms</p>
              <p className="font-bold text-neutral-900">{listing.bedrooms} Beds</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25v-2.625c0-1.036-.84-1.875-1.875-1.875H5.625c-1.036 0-1.875.84-1.875 1.875v2.625M3.75 14.25h16.5M3.75 14.25v3.375c0 .621.504 1.125 1.125 1.125h15c.621 0 1.125-.504 1.125-1.125V14.25M6 7.5h12M12 4.5c.621 0 1.125-.504 1.125-1.125V3h-2.25v.375c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-neutral-600">Bathrooms</p>
              <p className="font-bold text-neutral-900">{listing.bathrooms} Baths</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V3.75m0 9.75v5.625m0-15.375h5.625M9 3.75H3.375m5.625 16.5H3.375m5.625 0h5.625" />
              </svg>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-neutral-600">Total Area</p>
              <p className="font-bold text-neutral-900">{listing.size.toLocaleString()} sqft</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((amenity) => (
              <span key={amenity} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-800 border border-neutral-200/40">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

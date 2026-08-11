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

      <aside className="card space-y-5 h-fit">
        <div>
          <p className="text-sm text-neutral-600">Price</p>
          <p className="text-3xl font-semibold text-primary">{formatPrice(listing.price)}</p>
          {listing.rentFrequency ? <p className="text-sm text-neutral-600">/{listing.rentFrequency}</p> : null}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-neutral-600">Type</dt>
            <dd className="font-medium capitalize">{listing.type}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Bedrooms</dt>
            <dd className="font-medium">{listing.bedrooms}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Bathrooms</dt>
            <dd className="font-medium">{listing.bathrooms}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Size</dt>
            <dd className="font-medium">{listing.size} sqft</dd>
          </div>
        </dl>

        <div>
          <p className="text-sm text-neutral-600 mb-2">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-900">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

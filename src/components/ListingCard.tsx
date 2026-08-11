import { Link } from 'react-router-dom'
import type { Listing } from '../types/listing'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(price)
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images.slice().sort((a, b) => a.sortOrder - b.sortOrder).find((image) => image.isCover) ?? listing.images[0]

  return (
    <article className="card overflow-hidden text-left">
      <Link to={`/property/${listing.id}`} className="block">
        {cover ? (
          <img
            src={cover.url}
            alt={listing.title}
            className="h-56 w-full rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
            No images available
          </div>
        )}
      </Link>
      <div className="mt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-600">{listing.city} · {listing.area}</p>
            <h3 className="text-xl font-semibold text-neutral-900">{listing.title}</h3>
          </div>
          <span className={listing.status === 'published' ? 'badge-success' : 'badge-warning'}>
            {listing.status}
          </span>
        </div>

        <p className="text-sm text-neutral-600 line-clamp-2">{listing.description}</p>

        <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
          <span>{listing.bedrooms} bed</span>
          <span>{listing.bathrooms} bath</span>
          <span>{listing.size} sqft</span>
          <span className="capitalize">{listing.type}</span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-600">Price</p>
            <p className="text-lg font-semibold text-primary">{formatPrice(listing.price)}</p>
          </div>
          <Link to={`/property/${listing.id}`} className="btn-primary">
            View
          </Link>
        </div>
      </div>
    </article>
  )
}

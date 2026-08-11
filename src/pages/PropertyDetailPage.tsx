import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ListingDetail from '../components/ListingDetail'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { propertyRowToListing } from '../lib/listing-mappers'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { data: remoteListing } = useQuery({
    queryKey: ['property-detail', id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !id) return null

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id,title,description,type,address,city,area,price,rent_frequency,bedrooms,bathrooms,size,amenities,status,portal_links,bayut_url,external_url,created_at')
        .eq('id', id)
        .eq('status', 'published')
        .single()

      if (propertyError) throw propertyError

      const { data: images, error: imagesError } = await supabase
        .from('property_images')
        .select('id,property_id,url,storage_path,sort_order,is_cover')
        .eq('property_id', id)
        .order('sort_order', { ascending: true })

      if (imagesError) throw imagesError

      return property ? propertyRowToListing(property, images ?? []) : null
    },
  })

  const listing = remoteListing

  if (!listing) {
    return (
      <div className="card">
        <p className="text-neutral-600">Listing not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to listings</Link>
      </div>
    )
  }

  return <ListingDetail listing={listing} />
}

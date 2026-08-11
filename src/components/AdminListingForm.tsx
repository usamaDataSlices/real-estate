import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Listing, ListingImage } from '../types/listing'
import { PORTAL_OPTIONS, resolvePortalLinks } from '../lib/portalLinks'
import ImageUploader from './ImageUploader'

const portalLinkSchema = z.object({
  portal: z.string().min(1),
  url: z.string().url('Enter a valid URL').or(z.literal('')),
})

const listingSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  type: z.enum(['apartment', 'villa', 'studio', 'office', 'townhouse', 'penthouse']),
  address: z.string().min(2, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  price: z.coerce.number().nonnegative(),
  rentFrequency: z.string().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  size: z.coerce.number().positive(),
  amenities: z.string().optional(),
  status: z.enum(['draft', 'published']),
  portalLinks: z.array(portalLinkSchema),
})

export type AdminListingFormValues = z.infer<typeof listingSchema>

type Props = {
  value: Listing | null
  onSubmit: (payload: AdminListingFormValues & { images: ListingImage[] }) => void
  onCancel: () => void
}

const emptyDefaults: AdminListingFormValues = {
  title: '',
  description: '',
  type: 'apartment',
  address: '',
  city: '',
  area: '',
  price: 0,
  rentFrequency: '',
  bedrooms: 0,
  bathrooms: 0,
  size: 0,
  amenities: '',
  status: 'draft',
  portalLinks: [],
}

export default function AdminListingForm({ value, onSubmit, onCancel }: Props) {
  const form = useForm<AdminListingFormValues>({
    resolver: zodResolver(listingSchema) as any,
    defaultValues: emptyDefaults,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'portalLinks',
  })

  const imageState = useForm<{ images: ListingImage[] }>({ defaultValues: { images: [] } })

  useEffect(() => {
    if (!value) {
      form.reset(emptyDefaults)
      imageState.reset({ images: [] })
      return
    }

    form.reset({
      title: value.title,
      description: value.description,
      type: value.type,
      address: value.address,
      city: value.city,
      area: value.area,
      price: value.price,
      rentFrequency: value.rentFrequency ?? '',
      bedrooms: value.bedrooms,
      bathrooms: value.bathrooms,
      size: value.size,
      amenities: value.amenities.join(', '),
      status: value.status,
      portalLinks: resolvePortalLinks(value).map((link) => ({
        portal: link.portal,
        url: link.url,
      })),
    })
    imageState.reset({ images: value.images })
  }, [form, imageState, value])

  const images = imageState.watch('images')

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((data: AdminListingFormValues) => {
        onSubmit({
          ...data,
          portalLinks: data.portalLinks.filter((link) => link.url.trim()),
          images,
        })
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Title</span>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('title')} />
          <p className="text-xs text-danger">{form.formState.errors.title?.message}</p>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Property type</span>
          <select className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('type')}>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="studio">Studio</option>
            <option value="office">Office</option>
            <option value="townhouse">Townhouse</option>
            <option value="penthouse">Penthouse</option>
          </select>
        </label>
      </div>

      <label className="space-y-1 block">
        <span className="text-sm font-medium text-neutral-900">Description</span>
        <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2" rows={4} {...form.register('description')} />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">City</span>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('city')} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Area</span>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('area')} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Address</span>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('address')} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Price</span>
          <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('price')} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Bedrooms</span>
          <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('bedrooms')} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Bathrooms</span>
          <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('bathrooms')} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Size</span>
          <input type="number" className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('size')} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Rent frequency</span>
          <select className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('rentFrequency')}>
            <option value="">None</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Status</span>
          <select className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-neutral-900">Amenities</span>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2" placeholder="Pool, Gym, Parking" {...form.register('amenities')} />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-neutral-900">Portal links</span>
          <button
            type="button"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
            onClick={() => append({ portal: 'bayut', url: '' })}
          >
            Add portal link
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-neutral-600">No portal links yet. Add Bayut, Dubizzle, Property Finder, or other URLs.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <label className="space-y-1 block">
                  <span className="text-xs text-neutral-600">Portal</span>
                  <select className="w-full rounded-lg border border-neutral-200 px-3 py-2" {...form.register(`portalLinks.${index}.portal`)}>
                    {PORTAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs text-neutral-600">URL</span>
                  <input
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2"
                    placeholder="https://"
                    {...form.register(`portalLinks.${index}.url`)}
                  />
                  <p className="text-xs text-danger">{form.formState.errors.portalLinks?.[index]?.url?.message}</p>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="rounded-md border border-danger px-3 py-2 text-sm text-danger"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ImageUploader propertyId={value?.id} value={imageState.watch('images').map((image) => ({ ...image }))} onChange={(next) => imageState.setValue('images', next)} />

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          {value ? 'Update listing' : 'Create listing'}
        </button>
        <button type="button" className="rounded-md border border-neutral-200 px-4 py-2" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export { listingSchema }

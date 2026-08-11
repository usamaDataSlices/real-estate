import { useState } from 'react'

type Props = {
  images: { url: string; alt?: string }[]
}

export default function ListingGallery({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const safeImages = images.filter((image) => Boolean(image?.url))
  const main = safeImages[selectedIndex] ?? safeImages[0]

  const goToIndex = (index: number) => {
    if (!safeImages.length) return
    setSelectedIndex((index + safeImages.length) % safeImages.length)
  }

  if (!safeImages.length) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
        No images available for this property.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button type="button" className="block w-full text-left" onClick={() => setIsModalOpen(true)} aria-label="Open image gallery">
        <img src={main.url} alt={main.alt ?? 'Property image'} className="h-96 w-full rounded-xl object-cover" />
      </button>

      {safeImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              className={`overflow-hidden rounded-lg border ${selectedIndex === index ? 'border-primary ring-2 ring-primary/25' : 'border-neutral-200'}`}
              onClick={() => goToIndex(index)}
            >
              <img src={image.url} alt={image.alt ?? 'Property thumbnail'} className="h-24 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm text-neutral-900"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>

            <img src={main.url} alt={main.alt ?? 'Property image'} className="max-h-[80vh] w-full rounded-xl object-contain" />

            {safeImages.length > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button type="button" className="rounded-md border border-white/80 px-3 py-2 text-sm text-white" onClick={() => goToIndex(selectedIndex - 1)}>
                  Previous
                </button>
                <button type="button" className="rounded-md border border-white/80 px-3 py-2 text-sm text-white" onClick={() => goToIndex(selectedIndex + 1)}>
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

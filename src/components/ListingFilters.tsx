type Filters = {
  search: string
  city: string
  type: string
  minPrice: string
  maxPrice: string
  bedrooms: string
}

type Props = {
  value: Filters
  onChange: (next: Filters) => void
}

export default function ListingFilters({ value, onChange }: Props) {
  return (
    <section className="card mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <input
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
        placeholder="Search title or location"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
      />
      <input
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
        placeholder="City"
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
      />
      <select
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value })}
      >
        <option value="">All types</option>
        <option value="apartment">Apartment</option>
        <option value="villa">Villa</option>
        <option value="studio">Studio</option>
        <option value="office">Office</option>
        <option value="townhouse">Townhouse</option>
        <option value="penthouse">Penthouse</option>
      </select>
      <input
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
        placeholder="Min price"
        inputMode="numeric"
        value={value.minPrice}
        onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
      />
      <input
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
        placeholder="Max price"
        inputMode="numeric"
        value={value.maxPrice}
        onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
      />
      <select
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
        value={value.bedrooms}
        onChange={(e) => onChange({ ...value, bedrooms: e.target.value })}
      >
        <option value="">Any beds</option>
        <option value="0">Studio</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
      </select>
    </section>
  )
}

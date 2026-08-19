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
    <section className="card grid gap-3 rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.05)] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
          </svg>
        </span>
        <input
          className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-sm font-semibold text-neutral-900 placeholder-neutral-600/70"
          placeholder="Search location/title..."
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>

      {/* City Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </span>
        <input
          className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-sm font-semibold text-neutral-900 placeholder-neutral-600/70"
          placeholder="City"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
        />
      </div>

      {/* Type Filter */}
      <div className="relative">
        <select
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 appearance-none cursor-pointer"
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
        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </div>

      {/* Min Price */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[10px] font-bold text-neutral-600">
          AED
        </span>
        <input
          className="w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-3 py-2.5 text-sm font-semibold text-neutral-900 placeholder-neutral-600/70"
          placeholder="Min Price"
          inputMode="numeric"
          value={value.minPrice}
          onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
        />
      </div>

      {/* Max Price */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[10px] font-bold text-neutral-600">
          AED
        </span>
        <input
          className="w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-3 py-2.5 text-sm font-semibold text-neutral-900 placeholder-neutral-600/70"
          placeholder="Max Price"
          inputMode="numeric"
          value={value.maxPrice}
          onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
        />
      </div>

      {/* Bedrooms Selector */}
      <div className="relative">
        <select
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 appearance-none cursor-pointer"
          value={value.bedrooms}
          onChange={(e) => onChange({ ...value, bedrooms: e.target.value })}
        >
          <option value="">Any beds</option>
          <option value="0">Studio</option>
          <option value="1">1+ Br</option>
          <option value="2">2+ Br</option>
          <option value="3">3+ Br</option>
          <option value="4">4+ Br</option>
        </select>
        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </div>
    </section>
  )
}

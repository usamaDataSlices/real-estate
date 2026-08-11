export function getListingFallbackImage(title: string) {
  const safeTitle = (title || 'Property').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#F2F1ED"/>
      <rect x="48" y="48" width="1104" height="704" rx="32" fill="#FAFAF8" stroke="#E4E2DB" stroke-width="3"/>
      <circle cx="600" cy="360" r="180" fill="#C9A25D" opacity="0.2"/>
      <path d="M430 560c60-120 280-120 340 0" fill="none" stroke="#C9A25D" stroke-width="12" stroke-linecap="round"/>
      <text x="600" y="320" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="700" fill="#1F1E1B">${safeTitle}</text>
      <text x="600" y="380" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="#6B6B63">No listing image available</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

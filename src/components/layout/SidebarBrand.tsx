import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

type SidebarBrandProps = {
  onNavigate?: () => void
}

export default function SidebarBrand({ onNavigate }: SidebarBrandProps) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className="flex items-center gap-3 px-4 py-5 group"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-accent-light transition-transform duration-300 group-hover:scale-105">
        <Home className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-bold font-heading tracking-wide text-neutral-900 group-hover:text-primary transition-colors leading-tight">
        BELGRAVIA
        <span className="block font-extralight text-accent-dark text-sm tracking-widest">
          ESTATES
        </span>
      </span>
    </Link>
  )
}

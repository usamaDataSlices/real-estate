import { Menu } from 'lucide-react'

type MobileHeaderProps = {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-neutral-200 bg-white/90 px-4 backdrop-blur-md lg:hidden">
      <button
        type="button"
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="ml-3 text-sm font-bold font-heading tracking-wide text-neutral-900">
        BELGRAVIA <span className="font-extralight text-accent-dark">ESTATES</span>
      </span>
    </header>
  )
}

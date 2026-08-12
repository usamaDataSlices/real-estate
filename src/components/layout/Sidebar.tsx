import { LogOut } from 'lucide-react'
import { mainNavItems } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'
import SidebarBrand from './SidebarBrand'
import SidebarNavItem from './SidebarNavItem'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarBrand onNavigate={onClose} />

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Navigation
          </p>
          {mainNavItems.map((item) => (
            <SidebarNavItem key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="space-y-3 border-t border-neutral-200 px-4 py-4">
          {user?.email ? (
            <div className="space-y-2">
              <p className="truncate text-xs text-neutral-600">{user.email}</p>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => void logout()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
          <p className="text-xs leading-relaxed text-neutral-500">
            Licensed Real Estate Brokerage. Regulated by RERA #12847.
          </p>
        </div>
      </aside>
    </>
  )
}

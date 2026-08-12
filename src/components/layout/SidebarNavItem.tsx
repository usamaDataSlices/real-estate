import { NavLink } from 'react-router-dom'
import type { NavItem } from '../../config/navigation'

type SidebarNavItemProps = {
  item: NavItem
  onNavigate?: () => void
}

export default function SidebarNavItem({ item, onNavigate }: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  )
}

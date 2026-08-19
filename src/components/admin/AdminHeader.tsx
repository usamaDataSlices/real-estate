import { FileText, Home } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type ActiveTab = 'listings' | 'documents'

type Props = {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}

export default function AdminHeader({ activeTab, onTabChange }: Props) {
  const { user } = useAuth()

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-dark">Admin Panel</p>
        <h2 className="text-2xl font-heading font-semibold text-primary">
          {activeTab === 'listings' ? 'Property Listings' : 'Document Hub'}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">Signed in as {user?.email ?? 'admin'}.</p>
      </div>
      <div className="flex rounded-lg bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => onTabChange('listings')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-white text-primary shadow-sm' : 'text-neutral-600 hover:text-primary'}`}
        >
          <Home className="h-4 w-4" /> Properties
        </button>
        <button
          type="button"
          onClick={() => onTabChange('documents')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'documents' ? 'bg-white text-primary shadow-sm' : 'text-neutral-600 hover:text-primary'}`}
        >
          <FileText className="h-4 w-4" /> Documents
        </button>
      </div>
    </section>
  )
}

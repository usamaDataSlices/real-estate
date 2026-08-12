import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import AppFooter from './AppFooter'

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="container flex-1 py-10">
          {children}
        </main>

        <AppFooter />
      </div>
    </div>
  )
}

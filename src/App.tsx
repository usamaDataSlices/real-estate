import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PublicListings from './pages/PublicListings'
import AdminDashboard from './pages/AdminDashboard'
import PropertyDetailPage from './pages/PropertyDetailPage'
import './App.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-neutral-50">
          {/* Elegant Sticky Navigation Bar */}
          <header className="sticky top-0 z-50 border-b border-neutral-200/50 bg-white/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-accent-light transition-transform duration-300 group-hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </span>
                
                <span className="text-xl font-bold font-heading tracking-wide text-neutral-900 group-hover:text-primary transition-colors">
                  BELGRAVIA <span className="font-extralight text-accent-dark">ESTATES</span>
                </span>
              </Link>

              <nav className="flex items-center gap-6">
                <Link to="/" className="text-sm font-semibold text-neutral-600 hover:text-primary transition-colors">
                  Browse Properties
                </Link>
                <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 text-neutral-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Admin Portal
                </Link>
              </nav>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="container flex-1 py-10">
            <Routes>
              <Route path="/" element={<PublicListings />} />
              <Route path="/property/:id" element={<PropertyDetailPage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </main>

          {/* Footer Area */}
          <footer className="border-t border-neutral-200 bg-white py-10 mt-16 text-neutral-600 text-sm">
            <div className="container grid gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-heading tracking-wide text-neutral-900">
                    BELGRAVIA <span className="font-extralight text-accent-dark">ESTATES</span>
                  </span>
                </div>
                <p className="font-light leading-relaxed max-w-sm text-neutral-600">
                  Providing premium real estate services, luxury home curation, and investment advisory in prime development tracts.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-neutral-900 uppercase tracking-wider text-xs">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/" className="hover:text-primary transition-colors">Residential Search</Link>
                  </li>
                  <li>
                    <Link to="/admin" className="hover:text-primary transition-colors">Broker Admin Console</Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-neutral-900 uppercase tracking-wider text-xs">Legal</h4>
                <p className="font-light leading-relaxed">
                  Licensed Real Estate Brokerage.<br />
                  Licensed by DED, Regulated by RERA number 12847.<br />
                  © {new Date().getFullYear()} Belgravia Estates. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

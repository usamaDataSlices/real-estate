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
        <div className="container py-8">
          <header className="flex items-center justify-between mb-6">
            <Link to="/" className="text-2xl font-heading text-primary">Property Portal</Link>
            <nav className="space-x-4">
              <Link to="/" className="text-neutral-600">Listings</Link>
              <Link to="/admin" className="text-neutral-600">Admin</Link>
            </nav>
          </header>

          <main>
            <Routes>
              <Route path="/" element={<PublicListings />} />
              <Route path="/property/:id" element={<PropertyDetailPage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/layout/AppLayout'
import PublicListings from './pages/PublicListings'
import AdminDashboard from './pages/AdminDashboard'
import PropertyDetailPage from './pages/PropertyDetailPage'
import BookingsPage from './pages/BookingsPage'
import './App.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<PublicListings />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

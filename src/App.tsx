import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import PublicListings from './pages/PublicListings'
import AdminDashboard from './pages/AdminDashboard'
import PropertyDetailPage from './pages/PropertyDetailPage'
import BookingsPage from './pages/BookingsPage'
import NotesPage from './pages/NotesPage'
import CredentialsPage from './pages/CredentialsPage'
import TicketsPage from './pages/TicketsPage'
import ExcelEditorPage from './pages/ExcelEditorPage'
import './App.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<PublicListings />} />
                <Route path="/property/:id" element={<PropertyDetailPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/credentials" element={<CredentialsPage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/excel" element={<ExcelEditorPage />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

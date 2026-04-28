import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PropertyList from './pages/PropertyList'
import PropertyDetail from './pages/PropertyDetail'
import DealAnalyzer from './pages/DealAnalyzer'

function AuthGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2F2F7' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-brand-500 flex items-center justify-center animate-pulse">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'properties', element: <PropertyList /> },
      { path: 'properties/:id', element: <PropertyDetail /> },
      { path: 'deal-analyzer', element: <DealAnalyzer /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

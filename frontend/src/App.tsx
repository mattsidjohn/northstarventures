import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import PropertyList from './pages/PropertyList'
import PropertyDetail from './pages/PropertyDetail'
import Comparison from './pages/Comparison'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'properties', element: <PropertyList /> },
      { path: 'properties/:id', element: <PropertyDetail /> },
{ path: 'comparison', element: <Comparison /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

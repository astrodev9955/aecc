import { Navigate, Outlet } from 'react-router-dom'
import { BootScreen } from '../components/NeedProject'
import { useAuth } from '../context/Auth'

export default function RequireAdmin() {
  const { user, ready } = useAuth()
  if (!ready) return <BootScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/app" replace />
  return <Outlet />
}

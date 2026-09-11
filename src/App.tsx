import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastHost } from './components/ToastHost'
import { AuthProvider } from './context/Auth'
import { PlatformProvider } from './context/Platform'
import AppLayout from './pages/AppLayout'
import Billing from './pages/Billing'
import Capture from './pages/Capture'
import Desk from './pages/Desk'
import Landing from './pages/Landing'
import Ledger from './pages/Ledger'
import Library from './pages/Library'
import Login from './pages/Login'
import NewProject from './pages/NewProject'
import Passport from './pages/Passport'
import Portfolio from './pages/Portfolio'
import PublicPassport from './pages/PublicPassport'
import ReceiptDetail from './pages/ReceiptDetail'
import Register from './pages/Register'
import RequireAdmin from './pages/RequireAdmin'
import RequireAuth from './pages/RequireAuth'
import Settings from './pages/Settings'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminProjects from './pages/admin/Projects'
import AdminReceipts from './pages/admin/Receipts'
import AdminUserDetail from './pages/admin/UserDetail'
import AdminBillingInvoices from './pages/admin/Invoices'
import AdminPayments from './pages/admin/Payments'
import AdminSliders from './pages/admin/Sliders'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminUsers from './pages/admin/Users'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlatformProvider>
        <ToastHost />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/p/:token" element={<PublicPassport />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Desk />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="capture" element={<Capture />} />
              <Route path="passport" element={<Passport />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="library" element={<Library />} />
              <Route path="settings" element={<Settings />} />
              <Route path="billing" element={<Billing />} />
              <Route path="new" element={<NewProject />} />
              <Route path="receipt/:id" element={<ReceiptDetail />} />
            </Route>
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="invoices" element={<AdminBillingInvoices />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="sliders" element={<AdminSliders />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="receipts" element={<AdminReceipts />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </PlatformProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

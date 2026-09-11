import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Mark } from '../../components/Brand'
import { useAuth } from '../../context/Auth'

const NAV = [
  {
    label: 'Desk',
    links: [
      { to: '/admin', end: true, name: 'Overview' },
      { to: '/admin/users', name: 'Accounts' },
      { to: '/admin/invoices', name: 'Billing' },
    ],
  },
  {
    label: 'Site',
    links: [
      { to: '/admin/subscriptions', name: 'Subscriptions' },
      { to: '/admin/payments', name: 'Payments' },
      { to: '/admin/sliders', name: 'Sliders' },
    ],
  },
  {
    label: 'Records',
    links: [
      { to: '/admin/projects', name: 'Projects' },
      { to: '/admin/receipts', name: 'Invoices' },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell admin-shell">
      <aside>
        <NavLink to="/" className="brand brand-compact">
          <Mark size={24} />
          <span>
            Circular
            <small>Admin</small>
          </span>
        </NavLink>

        <p className="admin-aside-note">
          Control room
          <small>Plans, processors, sliders, and the ledger.</small>
        </p>

        <nav className="app-nav admin-nav">
          {NAV.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-label">{group.label}</p>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}>
                  {link.name}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="aside-foot">
          <NavLink to="/app" className="admin-workspace-link">
            Workspace
            <small>Open the material ledger</small>
          </NavLink>
          <p className="admin-aside-email">{user?.email}</p>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              void logout().then(() => navigate('/'))
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

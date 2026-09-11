import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPage } from '../../components/AdminPage'
import { usePlatform } from '../../context/Platform'
import { adminListUsers, type AuthUser } from '../../lib/api'

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsers() {
  const { settings } = usePlatform()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState('all')
  const [role, setRole] = useState('all')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setBusy(true)
      adminListUsers({ q, plan, role })
        .then((data) => {
          setUsers(data.users)
          setError('')
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load accounts'))
        .finally(() => setBusy(false))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [q, plan, role])

  return (
    <AdminPage
      kicker="Desk"
      title="Accounts"
      lede="Search by name, email, or phone. Change plan and role from the account file."
    >
      {error ? <p className="banner warn">{error}</p> : null}

      <div className="toolbar admin-toolbar">
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone"
          aria-label="Search accounts"
        />
        <select className="search" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filter by plan">
          <option value="all">All plans</option>
          {settings.plans
            .filter((item) => item.id !== 'free')
            .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select className="search" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Members</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Account</th>
              <th>Plan</th>
              <th>Payment</th>
              <th>Usage</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <Link to={`/admin/users/${user.id}`}>{user.name}</Link>
                  <div className="muted tiny">
                    {user.email}
                    {user.role === 'admin' ? ' · Admin' : ''}
                  </div>
                </td>
                <td>
                  {user.planName}
                  <div className="muted tiny">
                    {user.planStatus === 'trialing'
                      ? `Trial · ${user.trialDaysLeft}d left`
                      : user.planStatus === 'expired'
                        ? 'Trial ended'
                        : user.planStatus === 'pending_payment'
                          ? 'Awaiting payment'
                          : user.pendingPlanId
                            ? `Pending ${user.pendingPlanId}`
                            : user.planStatus}
                  </div>
                </td>
                <td>{user.payment?.label ?? '—'}</td>
                <td>
                  {user.usage.projects} jobs
                  <div className="muted tiny">{user.usage.receipts} invoices</div>
                </td>
                <td>{when(user.createdAt)}</td>
              </tr>
            ))}
            {!busy && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No accounts match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}

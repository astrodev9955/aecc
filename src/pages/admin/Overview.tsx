import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPage } from '../../components/AdminPage'
import { adminOverview, type AdminReceiptRow, type AdminStats, type AuthUser } from '../../lib/api'
import { formatUsd } from '../../lib/calc'
import { usePlatform } from '../../context/Platform'

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AuthUser[]>([])
  const [receipts, setReceipts] = useState<AdminReceiptRow[]>([])
  const { settings } = usePlatform()
  const [error, setError] = useState('')

  useEffect(() => {
    adminOverview()
      .then((data) => {
        setStats(data.stats)
        setUsers(data.recentUsers)
        setReceipts(data.recentReceipts)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load overview'))
  }, [])

  return (
    <AdminPage
      kicker="Desk"
      title="Overview"
      lede="Live accounts, paid plans, jobs, and supplier invoices across Circular."
    >
      {error ? <p className="banner warn">{error}</p> : null}

      {stats ? (
        <>
          <section className="kpi-row">
            <Kpi label="Accounts" value={String(stats.accounts)} hint={`${stats.admins} admin`} />
            <Kpi label="Projects" value={String(stats.projects)} hint="Building files" />
            <Kpi label="Invoices" value={String(stats.receipts)} hint="Supplier receipts" />
            <Kpi label="Monthly revenue" value={formatUsd(stats.mrr)} hint="Paid Studio + Firm list price" />
            <Kpi
              label="Open invoices"
              value={String(stats.openInvoices ?? 0)}
              hint="Transfers waiting to be marked paid"
            />
          </section>
          <section className="kpi-row">
            {settings.plans
              .filter((plan) => plan.id !== 'free')
              .map((plan) => (
              <Kpi
                key={plan.id}
                label={plan.name}
                value={String(stats.byPlan[plan.id as keyof typeof stats.byPlan] ?? 0)}
                hint={`$${plan.price}/${plan.cadence} · accounts on this plan`}
              />
            ))}
            <Kpi label="Pending checkout" value={String(stats.pendingCheckout)} hint="Paid plan not finished" />
          </section>
        </>
      ) : (
        <p className="muted">Loading workspace totals…</p>
      )}

      <p className="admin-section-label">New accounts</p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Plan</th>
              <th>Jobs</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <Link to={`/admin/users/${user.id}`}>{user.name}</Link>
                  <div className="muted tiny">{user.email}</div>
                </td>
                <td>
                  {user.planName}
                  {user.role === 'admin' ? <div className="muted tiny">Admin</div> : null}
                </td>
                <td>
                  {user.usage.projects} / {user.usage.receipts} invoices
                </td>
                <td>{when(user.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No accounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="admin-section-label">Latest invoices</p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Project</th>
              <th>Account</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.supplier || 'Untitled'}
                  <div className="muted tiny">{item.invoiceNo || item.date}</div>
                </td>
                <td>{item.projectName}</td>
                <td>
                  <Link to={`/admin/users/${item.userId}`}>{item.userName}</Link>
                </td>
                <td>{item.status}</td>
              </tr>
            ))}
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No invoices yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="kpi">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

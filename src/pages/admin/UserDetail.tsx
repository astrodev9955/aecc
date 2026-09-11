import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminPage } from '../../components/AdminPage'
import { usePlatform } from '../../context/Platform'
import { type PlanId } from '../../data/plans'
import {
  adminDeleteUser,
  adminGetUser,
  adminUpdateUser,
  type AdminProjectRow,
  type AdminReceiptRow,
  type AuthUser,
} from '../../lib/api'
import { toast } from '../../lib/toast'
import { useAuth } from '../../context/Auth'

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me, refresh } = useAuth()
  const { settings } = usePlatform()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [projects, setProjects] = useState<AdminProjectRow[]>([])
  const [receipts, setReceipts] = useState<AdminReceiptRow[]>([])
  const [planId, setPlanId] = useState<PlanId>('studio')
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    adminGetUser(id)
      .then((data) => {
        setUser(data.user)
        setProjects(data.projects)
        setReceipts(data.receipts)
        setPlanId(data.user.planId)
        setRole(data.user.role)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load account'))
  }, [id])

  async function save() {
    if (!id) return
    setBusy(true)
    try {
      const data = await adminUpdateUser(id, { planId, role })
      setUser(data.user)
      setPlanId(data.user.planId)
      setRole(data.user.role)
      if (me?.id === id) await refresh()
      toast('Account updated')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update account')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!id || !user) return
    if (!window.confirm(`Delete ${user.name} and every job under this account?`)) return
    setBusy(true)
    try {
      await adminDeleteUser(id)
      toast('Account deleted')
      navigate('/admin/users')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete account')
      setBusy(false)
    }
  }

  if (error) {
    return (
      <AdminPage kicker="Desk" title="Account" lede="Could not open this file.">
        <p className="banner warn">{error}</p>
        <Link to="/admin/users" className="btn btn-ghost">
          Back to accounts
        </Link>
      </AdminPage>
    )
  }

  if (!user) {
    return (
      <AdminPage kicker="Desk" title="Account" lede="Loading this file…">
        <p className="muted">Loading account…</p>
      </AdminPage>
    )
  }

  const self = me?.id === user.id

  return (
    <AdminPage
      kicker="Desk"
      title={user.name}
      lede={`${user.email}${user.phone ? ` · ${user.phone}` : ''}${user.role === 'admin' ? ' · Admin' : ''}`}
      actions={
        <Link to="/admin/users" className="btn btn-ghost">
          All accounts
        </Link>
      }
    >
      <section className="admin-card">
        <header className="admin-card-head">
          <div>
            <p className="admin-kind">Access</p>
            <h2>Plan and role</h2>
          </div>
        </header>
        <div className="admin-fields">
          <label>
            Plan
            <select value={planId === 'free' ? 'studio' : planId} onChange={(e) => setPlanId(e.target.value as PlanId)}>
              {settings.plans
                .filter((plan) => plan.id !== 'free')
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')} disabled={self}>
              <option value="user">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <p className="muted tiny">
          Plan changes here skip checkout and start a paid period.{' '}
          {user.planStatus === 'trialing'
            ? `Currently on a trial${user.trialEndsAt ? ` until ${when(user.trialEndsAt)}` : ''}.`
            : user.planStatus === 'expired'
              ? 'Trial has ended.'
              : user.payment
                ? `Saved method: ${user.payment.label}.`
                : 'No payment on file.'}
          {user.pendingPlanId ? ` Pending checkout: ${user.pendingPlanId}.` : ''}
        </p>
        <div className="admin-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy || self} onClick={() => void remove()}>
            Delete account
          </button>
        </div>
      </section>

      <p className="admin-section-label">Projects</p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Job</th>
              <th>Typology</th>
              <th>Invoices</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>
                  {project.name}
                  <div className="muted tiny">{project.address || 'No address'}</div>
                </td>
                <td>{project.typology || '—'}</td>
                <td>{project.receiptCount}</td>
                <td>{when(project.updatedAt)}</td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No projects.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="admin-section-label">Invoices</p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Project</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.supplier || 'Untitled'}
                  <div className="muted tiny">{item.invoiceNo || 'No number'}</div>
                </td>
                <td>{item.projectName}</td>
                <td>{item.date || when(item.createdAt)}</td>
                <td>{item.status}</td>
              </tr>
            ))}
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No invoices.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}

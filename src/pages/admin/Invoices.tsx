import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPage } from '../../components/AdminPage'
import { adminListInvoices, adminMarkInvoicePaid, adminVoidInvoice, type BillingInvoice } from '../../lib/api'
import { toast } from '../../lib/toast'

function when(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminBillingInvoices() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [status, setStatus] = useState('open')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    adminListInvoices(status === 'all' ? '' : status)
      .then((data) => {
        setInvoices(data.invoices)
        setError('')
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load invoices'))
  }, [status])

  async function markPaid(id: string) {
    setBusy(id)
    try {
      await adminMarkInvoicePaid(id)
      setInvoices((current) => current.filter((item) => item.id !== id))
      toast('Marked paid — subscription is active')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not mark paid')
    } finally {
      setBusy(null)
    }
  }

  async function voidInvoice(id: string) {
    if (!window.confirm('Void this open invoice?')) return
    setBusy(id)
    try {
      await adminVoidInvoice(id)
      setInvoices((current) => current.filter((item) => item.id !== id))
      toast('Invoice voided')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not void invoice')
    } finally {
      setBusy(null)
    }
  }

  return (
    <AdminPage
      kicker="Desk"
      title="Subscription invoices"
      lede="Mark bank, PayPal, and Wise transfers paid so the client plan starts. Stripe invoices land here after checkout."
    >
      {error ? <p className="banner warn">{error}</p> : null}
      <div className="toolbar admin-toolbar">
        <select className="search" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter invoices">
          <option value="open">Open</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Account</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Method</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.number}
                  <div className="muted tiny">
                    {item.reference} · {when(item.createdAt)}
                  </div>
                </td>
                <td>
                  {item.userId ? <Link to={`/admin/users/${item.userId}`}>{item.userName}</Link> : item.userName}
                  <div className="muted tiny">{item.userEmail}</div>
                </td>
                <td>{item.planName}</td>
                <td>
                  ${item.amount} {item.currency}
                </td>
                <td>
                  {item.methodName}
                  <div className="muted tiny">{item.status}</div>
                </td>
                <td>
                  {item.status === 'open' ? (
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="btn btn-small"
                        disabled={busy === item.id}
                        onClick={() => void markPaid(item.id)}
                      >
                        Mark paid
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        disabled={busy === item.id}
                        onClick={() => void voidInvoice(item.id)}
                      >
                        Void
                      </button>
                    </div>
                  ) : (
                    when(item.paidAt)
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No invoices in this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}

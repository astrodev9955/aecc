import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPage } from '../../components/AdminPage'
import { adminListReceipts, type AdminReceiptRow } from '../../lib/api'

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminReceipts() {
  const [receipts, setReceipts] = useState<AdminReceiptRow[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      adminListReceipts(q)
        .then((data) => {
          setReceipts(data.receipts)
          setError('')
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load invoices'))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [q])

  return (
    <AdminPage kicker="Records" title="Invoices" lede="Supplier receipts across every account.">
      {error ? <p className="banner warn">{error}</p> : null}

      <div className="toolbar admin-toolbar">
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search supplier, invoice, location"
          aria-label="Search invoices"
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Project</th>
              <th>Account</th>
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
                <td>
                  <Link to={`/admin/users/${item.userId}`}>{item.userName}</Link>
                  <div className="muted tiny">{item.userEmail}</div>
                </td>
                <td>{item.date || when(item.createdAt)}</td>
                <td>{item.status}</td>
              </tr>
            ))}
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No invoices match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}

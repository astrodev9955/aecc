import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NeedProject } from '../components/NeedProject'
import { useWorkspace } from '../context/Workspace'
import { getMaterial } from '../data/materials'
import {
  formatCarbon,
  formatDate,
  formatMass,
  formatUsd,
  metricsFor,
  receiptCarbon,
  receiptSpend,
  totals,
} from '../lib/calc'
import { toast } from '../lib/toast'

export default function Ledger() {
  const { project, removeReceipt } = useWorkspace()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<string>('all')
  const q = query.trim().toLowerCase()

  const receipts = useMemo(() => {
    if (!project) return []
    return project.receipts.filter((receipt) => {
      if (!q) return true
      const hay = [
        receipt.supplier,
        receipt.invoiceNo,
        receipt.location,
        ...receipt.lines.map((line) => line.description),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [project, q])

  const inventory = useMemo(() => {
    if (!project) return []
    return project.receipts.flatMap((receipt) =>
      receipt.lines
        .map((line) => ({ line, receipt, metrics: metricsFor(line), spec: getMaterial(line.materialId) }))
        .filter((row) => {
          if (family !== 'all' && row.metrics.category !== family) return false
          if (!q) return true
          return `${row.line.description} ${row.spec.name} ${row.receipt.supplier}`.toLowerCase().includes(q)
        }),
    )
  }, [project, family, q])

  if (!project) return <NeedProject />

  const t = totals(project)
  const categories = Object.keys(t.byCategory).sort()

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Material ledger</p>
          <h1>{project.name}</h1>
          <p className="muted">
            {[project.address, project.owner, project.year ? `Construction ${project.year}` : '']
              .filter(Boolean)
              .join(' · ') || 'Add project details in Settings.'}
          </p>
        </div>
        <Link to="/app/capture" className="btn">
          Log a receipt
        </Link>
      </header>

      <section className="kpi-row">
        <Kpi label="Logged spend" value={formatUsd(t.spend)} hint={`${t.receiptCount} invoices`} />
        <Kpi label="Embodied carbon" value={formatCarbon(t.carbonKg)} hint="A1–A3, indicative" />
        <Kpi label="Salvage value" value={formatUsd(t.salvageUsd)} hint="Secondary market" />
        <Kpi
          label="Recoverable value"
          value={`${Math.round(t.recoverableShare * 100)}%`}
          hint="Share of spend that can come back"
        />
      </section>

      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Search suppliers, invoices, materials…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search ledger"
        />
        <select
          className="search"
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          aria-label="Filter by material family"
        >
          <option value="all">All families</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <section>
        <h2 className="subhead">Receipts</h2>
        {receipts.length === 0 ? (
          <div className="empty">
            <h3>{project.receipts.length === 0 ? 'No invoices yet' : 'No matches'}</h3>
            <p className="muted">
              {project.receipts.length === 0
                ? 'Log a delivery to start the as-purchased record for this building.'
                : 'Try a different search.'}
            </p>
            {project.receipts.length === 0 && (
              <Link to="/app/capture" className="btn btn-small">
                Log a receipt
              </Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Lines</th>
                  <th>Spend</th>
                  <th>Carbon</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>
                      <Link to={`/app/receipt/${receipt.id}`}>
                        <strong>{receipt.supplier}</strong>
                      </Link>
                      <div className="muted tiny">
                        {receipt.location || receipt.source}
                      </div>
                    </td>
                    <td>{receipt.invoiceNo || '—'}</td>
                    <td>{formatDate(receipt.date)}</td>
                    <td>{receipt.lines.length}</td>
                    <td>{formatUsd(receiptSpend(receipt))}</td>
                    <td>{formatCarbon(receiptCarbon(receipt))}</td>
                    <td>
                      <Link to={`/app/receipt/${receipt.id}`} className="text-btn inline">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-btn inline"
                        onClick={() => {
                          if (!window.confirm(`Remove ${receipt.invoiceNo || 'this invoice'} from the ledger?`)) return
                          void removeReceipt(receipt.id)
                            .then(() => toast('Invoice removed'))
                            .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Could not remove invoice'))
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="subhead">Line inventory</h2>
        {inventory.length === 0 ? (
          <p className="muted">Nothing in the inventory matches this filter.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Material</th>
                  <th>Mass</th>
                  <th>Carbon</th>
                  <th>Salvage</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(({ line, receipt, metrics, spec }) => (
                  <tr key={line.id}>
                    <td>
                      {line.description || 'Untitled line'}
                      <div className="muted tiny">{receipt.supplier}</div>
                    </td>
                    <td>
                      {spec.name}
                      <div className="muted tiny">{spec.category}</div>
                    </td>
                    <td>{formatMass(line.massKg)}</td>
                    <td>{formatCarbon(metrics.carbonKg)}</td>
                    <td>{formatUsd(metrics.salvageUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
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

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LineEditor } from '../components/LineEditor'
import { useWorkspace } from '../context/Workspace'
import { formatCarbon, formatUsd, receiptCarbon, receiptSpend } from '../lib/calc'
import { isDuplicateInvoice } from '../lib/receipts'
import { toast } from '../lib/toast'
import type { Receipt } from '../types'
import { NeedProject } from '../components/NeedProject'

export default function ReceiptDetail() {
  const { id } = useParams()
  const { project } = useWorkspace()
  if (!project) return <NeedProject />
  const existing = project.receipts.find((item) => item.id === id)

  if (!existing) {
    return (
      <div className="panel">
        <div className="empty">
          <h3>Invoice not found</h3>
          <p className="muted">It may have been removed from this project.</p>
          <Link to="/app/ledger" className="btn btn-small">
            Back to ledger
          </Link>
        </div>
      </div>
    )
  }

  return <ReceiptEditor key={existing.id} receipt={existing} />
}

function ReceiptEditor({ receipt }: { receipt: Receipt }) {
  const navigate = useNavigate()
  const { project, updateReceipt, removeReceipt } = useWorkspace()
  const [draft, setDraft] = useState(receipt)
  const duplicate = project ? isDuplicateInvoice(project, draft) : false
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!draft.supplier.trim()) {
      toast('Add a supplier name')
      return
    }
    setBusy(true)
    try {
      await updateReceipt(draft)
      toast('Invoice updated')
      navigate('/app/ledger')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save invoice')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Invoice</p>
          <h1>{draft.supplier || 'Untitled supplier'}</h1>
          <p className="muted">
            {formatUsd(receiptSpend(draft))} · {formatCarbon(receiptCarbon(draft))}
          </p>
        </div>
        <Link to="/app/ledger" className="btn btn-ghost">
          Back to ledger
        </Link>
      </header>

      {duplicate && (
        <p className="banner warn">Another invoice on this job already uses this supplier and number.</p>
      )}

      <div className="review-meta">
        <label>
          Supplier
          <input value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} />
        </label>
        <label>
          Invoice
          <input value={draft.invoiceNo} onChange={(e) => setDraft({ ...draft, invoiceNo: e.target.value })} />
        </label>
        <label>
          Date
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </label>
        <label>
          Location
          <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </label>
      </div>

      <LineEditor lines={draft.lines} onChange={(lines) => setDraft({ ...draft, lines })} />

      <div className="review-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (!window.confirm(`Remove ${draft.invoiceNo || 'this invoice'} from the ledger?`)) return
            void removeReceipt(draft.id)
              .then(() => {
                toast('Invoice removed')
                navigate('/app/ledger')
              })
              .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Could not remove invoice'))
          }}
        >
          Delete invoice
        </button>
        <button type="button" className="btn" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

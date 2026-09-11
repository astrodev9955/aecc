import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ReceiptSheet } from '../components/Brand'
import { LineEditor } from '../components/LineEditor'
import { NeedProject } from '../components/NeedProject'
import { useAuth } from '../context/Auth'
import { useWorkspace } from '../context/Workspace'
import { SAMPLE_RECEIPTS, cloneSample, type SampleReceipt } from '../data/samples'
import { knownSuppliers } from '../lib/jobs'
import { blankReceipt } from '../lib/lines'
import { ApiError, parseReceipt } from '../lib/api'
import { isDuplicateInvoice } from '../lib/receipts'
import { toast } from '../lib/toast'
import type { Receipt } from '../types'

type Phase = 'pick' | 'scanning' | 'review'

export default function Capture() {
  const { user } = useAuth()
  const { project, projects, addReceipt } = useWorkspace()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('pick')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Receipt | null>(null)
  const [paste, setPaste] = useState('')
  const [notice, setNotice] = useState('')
  const [hot, setHot] = useState(false)

  if (!project) return <NeedProject />
  const job = project
  const atReceiptLimit =
    user != null &&
    (!user.writable || (user.limits.maxReceipts != null && user.usage.receipts >= user.limits.maxReceipts))
  const receiptLimitMessage = !user?.writable
    ? 'Your trial has ended. Subscribe to keep logging deliveries.'
    : user?.limits.maxReceipts
      ? `${user.planName} includes ${user.limits.maxReceipts} invoices. Upgrade to keep logging deliveries.`
      : 'Upgrade to keep logging deliveries.'

  function beginScan(sample: SampleReceipt) {
    if (atReceiptLimit) {
      setNotice(receiptLimitMessage)
      return
    }
    setActiveId(sample.id)
    setPhase('scanning')
    setNotice(`Reading ${sample.supplier} · ${sample.invoiceNo}`)
    window.setTimeout(() => {
      const next = cloneSample(sample)
      next.status = 'review'
      next.source = 'sample'
      setDraft(next)
      setNotice('Matched to the material library. Confirm quantities before posting.')
      setPhase('review')
    }, 1200)
  }

  function startBlank(supplier = '') {
    if (atReceiptLimit) {
      setNotice(receiptLimitMessage)
      return
    }
    setDraft(blankReceipt({ location: job.address || 'Jobsite', supplier }))
    setNotice(
      supplier
        ? `Blank invoice for ${supplier} — the name is already on this account.`
        : 'Blank invoice — enter the supplier and lines from the delivery ticket.',
    )
    setPhase('review')
  }

  const suppliers = knownSuppliers(projects)

  async function readWithCloud(label: string, input: { text?: string; file?: File }) {
    setPhase('scanning')
    setNotice(label)
    try {
      const data = await parseReceipt(job.id, input)
      setDraft({ ...data.receipt, location: data.receipt.location || job.address || 'Jobsite' })
      setNotice('Cloud model matched lines to the material library. Confirm quantities before posting.')
      setPhase('review')
    } catch (err) {
      setPhase('pick')
      setNotice(err instanceof ApiError || err instanceof Error ? err.message : 'Could not read this invoice')
    }
  }

  async function onFile(file: File) {
    if (atReceiptLimit) {
      setNotice(receiptLimitMessage)
      return
    }
    await readWithCloud(`Reading ${file.name} with the cloud model…`, { file })
  }

  async function onPaste() {
    if (atReceiptLimit) {
      setNotice(receiptLimitMessage)
      return
    }
    if (!paste.trim()) return
    await readWithCloud('Reading pasted invoice text with the cloud model…', { text: paste })
  }

  async function confirm() {
    if (!draft) return
    if (!draft.supplier.trim()) {
      setNotice('Add a supplier name before posting.')
      return
    }
    if (draft.lines.length === 0 || draft.lines.every((line) => !line.description.trim() && !line.quantity)) {
      setNotice('Add at least one line with a description or quantity.')
      return
    }
    try {
      await addReceipt({ ...draft, status: 'logged', postedAt: new Date().toISOString() })
      toast(`Posted ${draft.invoiceNo || 'invoice'} to ${job.name}`)
      navigate('/app/passport')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not post this invoice')
    }
  }

  const duplicate = draft ? isDuplicateInvoice(project, draft) : false

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Capture</p>
          <h1>Log a delivery.</h1>
          <p className="muted">
            Start from a blank invoice, paste text, or drop a photo. A cloud model reads the ticket
            and matches lines to carbon and salvage factors — you confirm before it hits the ledger.
          </p>
        </div>
        {phase === 'pick' && (
          <button type="button" className="btn" onClick={() => startBlank()} disabled={atReceiptLimit}>
            New invoice
          </button>
        )}
      </header>

      {atReceiptLimit && user ? (
        <p className="banner warn">
          {!user.writable
            ? 'Your trial has ended.'
            : `${user.planName} includes ${user.limits.maxReceipts} invoices.`}{' '}
          <Link to="/app/billing">Subscribe to keep logging deliveries</Link>.
        </p>
      ) : null}

      {notice && phase === 'pick' ? <p className="banner warn">{notice}</p> : null}

      {phase === 'pick' && (
        <>
          {suppliers.length > 0 ? (
            <section className="known-suppliers">
              <p className="eyebrow">Already on this ledger</p>
              <p className="muted tiny">Names you have posted before. A homemade tool starts from zero every morning.</p>
              <div className="supplier-chips">
                {suppliers.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="btn btn-ghost btn-small"
                    disabled={atReceiptLimit}
                    onClick={() => startBlank(item.name)}
                  >
                    {item.name}
                    <span className="muted"> · {item.count}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <div className="capture-grid">
            {SAMPLE_RECEIPTS.map((sample) => (
              <ReceiptSheet
                key={sample.id}
                sample={sample}
                active={activeId === sample.id}
                onClick={() => beginScan(sample)}
              />
            ))}
          </div>
          <p className="fineprint">Example tickets you can confirm and post, or start from a blank invoice.</p>

          <div className="drop-row">
            <label
              className={`dropzone ${hot ? 'is-hot' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setHot(true)
              }}
              onDragLeave={() => setHot(false)}
              onDrop={(e) => {
                e.preventDefault()
                setHot(false)
                const file = e.dataTransfer.files[0]
                if (file) void onFile(file)
              }}
            >
              <input
                type="file"
                accept="image/*,.pdf,.txt,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onFile(file)
                }}
              />
              <strong>Drop a receipt</strong>
              <span>Photos, PDFs, and text are read by a cloud model. Confirm before posting.</span>
            </label>
            <div className="paste-box">
              <label htmlFor="paste">Or paste invoice text</label>
              <textarea
                id="paste"
                rows={6}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={'Pacific Copper Works\nInvoice PCW-10933\n420 lf Type L copper 3/4 in. $4.85'}
              />
              <button type="button" className="btn btn-small" onClick={() => void onPaste()} disabled={!paste.trim()}>
                Read text
              </button>
            </div>
          </div>
        </>
      )}

      {phase === 'scanning' && (
        <div className="scanner" role="status">
          <div className="scanner-well">
            <div className="scan-line" />
            <p>{notice}</p>
            <p className="muted">Cloud model extracting lines and matching carbon factors…</p>
          </div>
        </div>
      )}

      {phase === 'review' && draft && (
        <div className="review">
          {notice && <p className="banner">{notice}</p>}
          {duplicate && (
            <p className="banner warn">
              An invoice with this number from {draft.supplier || 'this supplier'} is already on the
              ledger. Post only if this is a genuine duplicate delivery.
            </p>
          )}
          <div className="review-meta">
            <label>
              Supplier
              <input
                value={draft.supplier}
                onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
              />
            </label>
            <label>
              Invoice
              <input
                value={draft.invoiceNo}
                onChange={(e) => setDraft({ ...draft, invoiceNo: e.target.value })}
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              Location
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </label>
          </div>

          <LineEditor lines={draft.lines} onChange={(lines) => setDraft({ ...draft, lines })} />

          <div className="review-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setPhase('pick')}>
              Back
            </button>
            <button type="button" className="btn" onClick={confirm}>
              Post to passport
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

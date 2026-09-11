import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NeedProject } from '../components/NeedProject'
import { PassportCertificate } from '../components/PassportCertificate'
import { useAuth } from '../context/Auth'
import { useWorkspace } from '../context/Workspace'
import { totals } from '../lib/calc'
import { exportProject } from '../lib/api'
import { downloadText } from '../lib/export'
import { toast } from '../lib/toast'

export default function Passport() {
  const { user } = useAuth()
  const { project, sharePassport, revokeShare } = useWorkspace()
  const [busy, setBusy] = useState<'share' | 'rotate' | 'revoke' | 'csv' | 'json' | null>(null)
  if (!project) return <NeedProject />
  const job = project
  const canExport = Boolean(user?.canExport)
  const canShare = Boolean(user?.canShare)
  const t = totals(job)
  const shareUrl = job.shareToken ? `${window.location.origin}/p/${job.shareToken}` : ''

  async function exportFile(format: 'json' | 'csv') {
    if (!canExport) {
      toast('CSV and JSON export are on Studio and Firm')
      return
    }
    setBusy(format)
    try {
      const file = await exportProject(job.id, format)
      downloadText(file.filename, file.content, file.mime)
      toast(format === 'csv' ? 'Inventory CSV downloaded' : 'Passport JSON downloaded')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not export')
    } finally {
      setBusy(null)
    }
  }

  async function onShare() {
    setBusy('share')
    try {
      const data = await sharePassport()
      if (data.url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.url)
        toast('Share link copied')
      } else {
        toast('Share link is ready')
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create the share link')
    } finally {
      setBusy(null)
    }
  }

  async function onRotate() {
    if (!window.confirm('Replace the link? The old URL will stop working.')) return
    setBusy('rotate')
    try {
      const data = await sharePassport(true)
      if (data.url && navigator.clipboard?.writeText) await navigator.clipboard.writeText(data.url)
      toast('New share link copied')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not replace the link')
    } finally {
      setBusy(null)
    }
  }

  async function onRevoke() {
    if (!window.confirm('Turn off the public link? Anyone with it will lose access.')) return
    setBusy('revoke')
    try {
      await revokeShare()
      toast('Share link turned off')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not turn off the link')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="panel passport-wrap">
      <header className="panel-head no-print">
        <div>
          <p className="eyebrow">Building passport</p>
          <h1>Birth certificate</h1>
          <p className="muted">
            Print the certificate here. Studio and Firm can send a read-only link so a buyer never
            needs an account.
          </p>
        </div>
        <div className="head-actions">
          {canExport ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void exportFile('csv')}
                disabled={t.lineCount === 0 || busy != null}
              >
                {busy === 'csv' ? 'Exporting…' : 'Export CSV'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void exportFile('json')}
                disabled={t.lineCount === 0 || busy != null}
              >
                {busy === 'json' ? 'Exporting…' : 'Export JSON'}
              </button>
            </>
          ) : (
            <Link to="/app/billing" className="btn btn-ghost">
              Upgrade to export
            </Link>
          )}
          <button type="button" className="btn" onClick={() => window.print()} disabled={t.lineCount === 0}>
            Print / save PDF
          </button>
        </div>
      </header>

      {t.lineCount > 0 ? (
        <section className="share-bar no-print">
          {canShare ? (
            <>
              <div>
                <p className="eyebrow">Share</p>
                <p className="muted">
                  {shareUrl
                    ? 'Anyone with the link can read this passport. They cannot edit the ledger.'
                    : 'Create a read-only link for a buyer, lender, or LCA consultant.'}
                </p>
                {shareUrl ? (
                  <p className="share-url">
                    <a href={shareUrl} target="_blank" rel="noreferrer">
                      {shareUrl}
                    </a>
                  </p>
                ) : null}
              </div>
              <div className="head-actions">
                <button type="button" className="btn" disabled={busy != null} onClick={() => void onShare()}>
                  {busy === 'share' ? 'Working…' : shareUrl ? 'Copy link' : 'Create share link'}
                </button>
                {shareUrl ? (
                  <>
                    <button type="button" className="btn btn-ghost" disabled={busy != null} onClick={() => void onRotate()}>
                      New link
                    </button>
                    <button type="button" className="btn btn-ghost" disabled={busy != null} onClick={() => void onRevoke()}>
                      Turn off
                    </button>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="eyebrow">Share</p>
                <p className="muted">
                  A sendable link is on Studio and Firm. Subscribe if the trial has ended.
                </p>
              </div>
              <Link to="/app/billing" className="btn btn-ghost">
                Upgrade to share
              </Link>
            </>
          )}
        </section>
      ) : null}

      {t.lineCount === 0 ? (
        <div className="empty">
          <h3>Nothing to certify yet</h3>
          <p className="muted">Log a supplier invoice and the birth certificate fills in from the ledger.</p>
          <Link to="/app/capture" className="btn btn-small">
            Log a receipt
          </Link>
        </div>
      ) : (
        <PassportCertificate project={job} />
      )}
    </div>
  )
}

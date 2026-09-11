import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Mark } from '../components/Brand'
import { PassportCertificate } from '../components/PassportCertificate'
import { getPublicPassport } from '../lib/api'
import { totals } from '../lib/calc'
import type { Project } from '../types'

export default function PublicPassport() {
  const { token } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getPublicPassport(token)
      .then((data) => {
        setProject(data.project)
        setError('')
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Passport not found'))
  }, [token])

  return (
    <div className="site public-passport">
      <header className="site-nav">
        <Link to="/" className="brand">
          <Mark />
          <span>
            Circular
            <small>Material Passports</small>
          </span>
        </Link>
        <nav>
          {project && totals(project).lineCount > 0 ? (
            <button type="button" className="btn btn-ghost btn-small no-print" onClick={() => window.print()}>
              Print / save PDF
            </button>
          ) : null}
          <Link to="/register" className="btn btn-small no-print">
            Start a trial
          </Link>
        </nav>
      </header>

      <div className="panel passport-wrap">
        {error ? (
          <div className="empty">
            <h3>This passport is off</h3>
            <p className="muted">{error}. Ask the studio for a new link, or start your own ledger.</p>
            <Link to="/" className="btn btn-small">
              Back to Circular
            </Link>
          </div>
        ) : !project ? (
          <p className="muted">Opening the birth certificate…</p>
        ) : totals(project).lineCount === 0 ? (
          <div className="empty">
            <h3>Nothing to certify yet</h3>
            <p className="muted">This file has no posted invoices.</p>
          </div>
        ) : (
          <>
            <header className="panel-head no-print">
              <div>
                <p className="eyebrow">Shared passport</p>
                <h1>Birth certificate</h1>
                <p className="muted">Read-only as-purchased record. Indicative carbon factors, not a certified LCA.</p>
              </div>
            </header>
            <PassportCertificate project={project} />
          </>
        )}
      </div>
    </div>
  )
}

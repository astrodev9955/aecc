import { Link } from 'react-router-dom'
import { NeedProject } from '../components/NeedProject'
import { useAuth } from '../context/Auth'
import { useWorkspace } from '../context/Workspace'
import { formatCarbon, formatDate, formatUsd, totals } from '../lib/calc'
import { attentionJobs, jobPulse } from '../lib/jobs'

export default function Desk() {
  const { user } = useAuth()
  const { projects, project, switchProject } = useWorkspace()
  if (projects.length === 0) return <NeedProject />

  const attention = attentionJobs(projects)
  const quiet = projects.map(jobPulse).filter((item) => item.gaps.length === 0)
  const nearInvoiceLimit =
    user?.limits.maxReceipts != null && user.usage.receipts >= Math.max(1, user.limits.maxReceipts - 3)
  const nearJobLimit =
    user?.limits.maxProjects != null && user.usage.projects >= user.limits.maxProjects

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Trailer desk</p>
          <h1>What needs a ticket.</h1>
          <p className="muted">
            A spreadsheet is easy to copy. This file is not — every delivery thickens the passport.
            Open Circular when a truck is on the dock, and again when a job goes quiet.
          </p>
        </div>
        <Link to={user && !user.writable ? '/app/billing' : '/app/capture'} className="btn">
          {user && !user.writable ? 'Subscribe' : 'Log a receipt'}
        </Link>
      </header>

      {user && !user.writable ? (
        <p className="banner warn">
          Your trial has ended. Existing jobs stay on the desk.{' '}
          <Link to="/app/billing">Subscribe to log new tickets</Link>.
        </p>
      ) : nearInvoiceLimit || nearJobLimit ? (
        <p className="banner warn">
          {nearJobLimit
            ? `${user?.planName} is at its project cap.`
            : `${user?.usage.receipts} of ${user?.limits.maxReceipts} invoices used.`}{' '}
          <Link to="/app/billing">Keep the ledger on a paid plan</Link>.
        </p>
      ) : null}

      <section className="desk-block">
        <h2 className="subhead">Needs you</h2>
        {attention.length === 0 ? (
          <p className="muted">Every job has an address, a typology, and a recent ticket. Log the next delivery.</p>
        ) : (
          <ul className="desk-list">
            {attention.map((item) => {
              const t = totals(item.project)
              return (
                <li key={item.project.id}>
                  <div>
                    <p className="desk-job">{item.project.name}</p>
                    <p className="muted tiny">
                      {item.gaps.join(' · ')}
                      {item.revision > 0 ? ` · Rev ${item.revision}` : ''}
                      {t.receiptCount > 0 ? ` · ${formatUsd(t.spend)}` : ''}
                    </p>
                  </div>
                  <div className="desk-actions">
                    <Link
                      to="/app/ledger"
                      className="btn btn-ghost btn-small"
                      onClick={() => switchProject(item.project.id)}
                    >
                      Ledger
                    </Link>
                    <Link
                      to={item.project.receipts.length === 0 || item.stale ? '/app/capture' : '/app/settings'}
                      className="btn btn-small"
                      onClick={() => switchProject(item.project.id)}
                    >
                      {item.project.receipts.length === 0 || item.stale ? 'Log ticket' : 'Fill details'}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {quiet.length > 0 ? (
        <section className="desk-block">
          <h2 className="subhead">Holding</h2>
          <ul className="desk-list is-quiet">
            {quiet.map((item) => {
              const t = totals(item.project)
              return (
                <li key={item.project.id}>
                  <div>
                    <p className="desk-job">{item.project.name}</p>
                    <p className="muted tiny">
                      Rev {item.revision}
                      {item.lastIso ? ` · last ticket ${formatDate(item.lastIso)}` : ''}
                      {` · ${formatCarbon(t.carbonKg)}`}
                    </p>
                  </div>
                  <Link
                    to="/app/passport"
                    className="text-btn"
                    onClick={() => switchProject(item.project.id)}
                  >
                    Passport
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {project ? (
        <p className="desk-note">
          Working file · <strong>{project.name}</strong> · revision {jobPulse(project).revision}. A
          buyer with the share link always sees this revision — not a snapshot you emailed last
          spring.
        </p>
      ) : null}
    </div>
  )
}

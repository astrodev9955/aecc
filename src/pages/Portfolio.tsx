import { Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useWorkspace } from '../context/Workspace'
import { formatCarbon, formatUsd, totals } from '../lib/calc'

export default function Portfolio() {
  const { user } = useAuth()
  const { projects, switchProject } = useWorkspace()
  const canPortfolio = Boolean(user?.canPortfolio)
  const rows = projects.map((project) => ({ project, t: totals(project) }))
  const office = rows.reduce(
    (acc, row) => ({
      spend: acc.spend + row.t.spend,
      carbonKg: acc.carbonKg + row.t.carbonKg,
      salvageUsd: acc.salvageUsd + row.t.salvageUsd,
      receipts: acc.receipts + row.t.receiptCount,
      jobs: acc.jobs + 1,
    }),
    { spend: 0, carbonKg: 0, salvageUsd: 0, receipts: 0, jobs: 0 },
  )

  if (!canPortfolio) {
    return (
      <div className="panel">
        <header className="panel-head">
          <div>
            <p className="eyebrow">Office</p>
            <h1>Portfolio</h1>
            <p className="muted">
              Firm rolls every building into one desk: spend, carbon, and salvage. Studio keeps
              each job on its own ledger.
            </p>
          </div>
        </header>
        <div className="empty">
          <h3>The office rollup is on Firm</h3>
          <p className="muted">
            You have {projects.length} job{projects.length === 1 ? '' : 's'} in this account. Upgrade
            to see them on one page.
          </p>
          <Link to="/app/billing?checkout=firm" className="btn">
            See Firm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Office</p>
          <h1>Portfolio</h1>
          <p className="muted">
            Every building file in this account. Open a job to keep logging, or send its passport
            from the birth certificate.
          </p>
        </div>
        <Link to="/app/new" className="btn">
          New project
        </Link>
      </header>

      <section className="kpi-row">
        <article className="kpi">
          <p>Jobs</p>
          <strong>{office.jobs}</strong>
          <small>In this account</small>
        </article>
        <article className="kpi">
          <p>Logged spend</p>
          <strong>{formatUsd(office.spend)}</strong>
          <small>{office.receipts} invoices</small>
        </article>
        <article className="kpi">
          <p>Embodied carbon</p>
          <strong>{formatCarbon(office.carbonKg)}</strong>
          <small>A1–A3, indicative</small>
        </article>
        <article className="kpi">
          <p>Salvage value</p>
          <strong>{formatUsd(office.salvageUsd)}</strong>
          <small>Secondary market</small>
        </article>
      </section>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Project</th>
              <th>Invoices</th>
              <th>Spend</th>
              <th>Carbon</th>
              <th>Salvage</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, t }) => (
              <tr key={project.id}>
                <td>
                  <Link
                    to="/app/ledger"
                    onClick={() => switchProject(project.id)}
                  >
                    {project.name}
                  </Link>
                  <div className="muted tiny">
                    {[project.address, project.typology, project.year || ''].filter(Boolean).join(' · ') || 'No address'}
                  </div>
                </td>
                <td>{t.receiptCount}</td>
                <td>{formatUsd(t.spend)}</td>
                <td>{formatCarbon(t.carbonKg)}</td>
                <td>{formatUsd(t.salvageUsd)}</td>
                <td>
                  {project.shareToken ? (
                    <a href={`/p/${project.shareToken}`} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    <Link to="/app/passport" onClick={() => switchProject(project.id)}>
                      Create
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No building files yet.{' '}
                  <Link to="/app/new">Open the first job</Link>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

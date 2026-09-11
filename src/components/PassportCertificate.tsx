import { Mark } from './Brand'
import {
  carbonIntensity,
  formatCarbon,
  formatDate,
  formatMass,
  formatUsd,
  metricsFor,
  totals,
} from '../lib/calc'
import { passportRevision } from '../lib/jobs'
import type { Project } from '../types'

export function passportIdFor(project: Project) {
  return `CIR-${project.id.replace(/-/g, '').slice(0, 8).toUpperCase()}-${project.year}`
}

export function PassportCertificate({ project }: { project: Project }) {
  const t = totals(project)
  const categories = Object.entries(t.byCategory).sort((a, b) => b[1].carbonKg - a[1].carbonKg)
  const maxCarbon = Math.max(...categories.map(([, v]) => v.carbonKg), 1)
  const issued = new Date().toISOString().slice(0, 10)
  const passportId = passportIdFor(project)

  return (
    <article className="certificate">
      <div className="cert-top">
        <Mark size={36} />
        <div>
          <p className="cert-kicker">Circular Material Passport</p>
          <h2>{project.name}</h2>
          <p>
            {project.address || 'Address not set'}
            <br />
            {[project.typology, project.areaSqft ? `${project.areaSqft.toLocaleString()} sf` : '', project.owner]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="muted tiny">
            Passport {passportId} · Revision {passportRevision(project)}
          </p>
        </div>
        <div className="stamp">
          <span>As-built</span>
          <strong>Rev {passportRevision(project)}</strong>
          <small>
            {project.year} · {formatDate(issued)}
          </small>
        </div>
      </div>

      <dl className="cert-stats">
        <div>
          <dt>Embodied carbon (A1–A3)</dt>
          <dd>{formatCarbon(t.carbonKg)}</dd>
        </div>
        <div>
          <dt>Salvage value</dt>
          <dd>{formatUsd(t.salvageUsd)}</dd>
        </div>
        <div>
          <dt>Material spend logged</dt>
          <dd>{formatUsd(t.spend)}</dd>
        </div>
        <div>
          <dt>Recoverable value</dt>
          <dd>{Math.round(t.recoverableShare * 100)}%</dd>
        </div>
      </dl>

      <p className="cert-note">
        Intensity: <strong>{carbonIntensity(t.carbonKg, project.areaSqft)}</strong>. This is a
        purchase-based inventory, not a whole-building LCA. Factors are indicative (ICE /
        industry averages) and should be replaced with EPDs where they exist.
      </p>

      <h3>Carbon by family</h3>
      <ul className="bars">
        {categories.map(([name, values]) => (
          <li key={name}>
            <div className="bar-label">
              <span>{name}</span>
              <span>
                {formatCarbon(values.carbonKg)} · salvage {formatUsd(values.salvageUsd)}
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(values.carbonKg / maxCarbon) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <h3>As-purchased inventory</h3>
      <div className="table-wrap">
        <table className="data compact">
          <thead>
            <tr>
              <th>Item</th>
              <th>Family</th>
              <th>Mass</th>
              <th>kgCO₂e</th>
              <th>Salvage</th>
              <th>End of life</th>
            </tr>
          </thead>
          <tbody>
            {project.receipts.flatMap((receipt) =>
              receipt.lines.map((line) => {
                const m = metricsFor(line)
                return (
                  <tr key={line.id}>
                    <td>
                      {line.description || 'Untitled line'}
                      <div className="muted tiny">
                        {receipt.supplier} · {receipt.invoiceNo}
                      </div>
                    </td>
                    <td>{m.category}</td>
                    <td>{formatMass(line.massKg)}</td>
                    <td>{Math.round(m.carbonKg).toLocaleString()}</td>
                    <td>{formatUsd(m.salvageUsd)}</td>
                    <td className={`eol eol-${m.recoverability}`}>{m.recoverability}</td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      </div>

      <footer className="cert-foot">
        <p>
          {t.receiptCount} supplier invoices · {t.lineCount} line items · mass {formatMass(t.massKg)}
        </p>
        <p>
          Circular does not replace an EPD-backed LCA. It prevents the worse outcome: having no
          primary record of what was bought.
        </p>
      </footer>
    </article>
  )
}

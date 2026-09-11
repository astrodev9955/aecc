import { useMemo, useState } from 'react'
import { MATERIALS } from '../data/materials'
import { formatUsd } from '../lib/calc'
import type { MaterialCategory } from '../types'

const FAMILIES: Array<MaterialCategory | 'All'> = [
  'All',
  'Metals',
  'Concrete',
  'Timber',
  'Envelope',
  'MEP',
  'Finishes',
]

export default function Library() {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<(typeof FAMILIES)[number]>('All')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MATERIALS.filter((spec) => {
      if (family !== 'All' && spec.category !== family) return false
      if (!q) return true
      return [spec.name, spec.category, spec.notes, ...spec.aliases].join(' ').toLowerCase().includes(q)
    })
  }, [query, family])

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Reference</p>
          <h1>Material library</h1>
          <p className="muted">
            Indicative A1–A3 carbon (ICE / industry averages) and secondary-market salvage. Replace
            with EPDs when the supplier has them.
          </p>
        </div>
      </header>

      <div className="toolbar">
        <input
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search copper, CLT, ready-mix…"
          aria-label="Search materials"
        />
        <select
          className="search"
          value={family}
          onChange={(e) => setFamily(e.target.value as (typeof FAMILIES)[number])}
          aria-label="Filter family"
        >
          {FAMILIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="library-grid">
        {rows.map((spec) => (
          <article key={spec.id} className="lib-card">
            <p className="eyebrow">{spec.category}</p>
            <h3>{spec.name}</h3>
            <dl>
              <div>
                <dt>Carbon</dt>
                <dd>{spec.carbonPerKg} kgCO₂e / kg</dd>
              </div>
              <div>
                <dt>Salvage</dt>
                <dd>{formatUsd(spec.salvagePerKg)} / kg</dd>
              </div>
              <div>
                <dt>Recoverability</dt>
                <dd className={`eol eol-${spec.recoverability}`}>{spec.recoverability}</dd>
              </div>
            </dl>
            <p className="muted tiny">{spec.notes}</p>
          </article>
        ))}
      </div>
      {rows.length === 0 && <p className="muted">No materials match that search.</p>}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Mark } from './Brand'
import type { ReactNode } from 'react'

export function AuthSplit({
  kicker,
  children,
}: {
  kicker: string
  children: ReactNode
}) {
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <Link to="/" className="brand">
          <Mark tone="light" />
          <span>
            Circular
            <small>Material Passports</small>
          </span>
        </Link>
        <p className="eyebrow">Construction ledger</p>
        <h1>Keep the receipts. Issue the birth certificate.</h1>
        <p>
          Sign in to a live workspace. Projects, invoices, carbon, and salvage stay on the server —
          not in this browser.
        </p>
      </aside>
      <main className="auth-main">
        <p className="eyebrow">{kicker}</p>
        {children}
      </main>
    </div>
  )
}

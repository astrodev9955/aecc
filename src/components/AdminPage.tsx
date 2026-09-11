import type { ReactNode } from 'react'

export function AdminPage({
  kicker = 'Admin',
  title,
  lede,
  actions,
  children,
}: {
  kicker?: string
  title: string
  lede?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">{kicker}</p>
          <h1>{title}</h1>
          {lede ? <p className="muted">{lede}</p> : null}
        </div>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </header>
      <div className="admin-page-body">{children}</div>
    </div>
  )
}

export function AdminSwitch({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="admin-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="admin-switch-track" aria-hidden="true" />
      <span>{children}</span>
    </label>
  )
}

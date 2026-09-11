import type { SampleReceipt } from '../data/samples'
import { formatUsd, receiptSpend } from '../lib/calc'

export function Mark({ size = 28, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  const plate = tone === 'light' ? '#F4EFE4' : '#1C1915'
  const glyph = tone === 'light' ? '#1C1915' : '#F4EFE4'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={plate} />
      <circle cx="24" cy="24" r="14.5" fill="none" stroke="#E8C9A8" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="#C45C26" strokeWidth="1.2" />
      <path d="M16 30 V18 H22 L24 22 L26 18 H32 V30 H28 V23 L24 28 L20 23 V30 Z" fill={glyph} />
    </svg>
  )
}

export function ReceiptSheet({
  sample,
  active,
  onClick,
}: {
  sample: SampleReceipt
  active?: boolean
  onClick?: () => void
}) {
  const spend = receiptSpend(sample)
  const inner = (
    <div className="receipt-photo-inner">
      <p className="receipt-kicker">Supplier invoice</p>
      <h3>{sample.supplier}</h3>
      <p className="receipt-meta">
        {sample.invoiceNo} · {sample.date}
      </p>
      <ul>
        {sample.lines.map((line) => (
          <li key={line.id}>
            <span>{line.description}</span>
            <span>{formatUsd(line.quantity * line.unitCost)}</span>
          </li>
        ))}
      </ul>
      <div className="receipt-total">
        <span>Total</span>
        <strong>{formatUsd(spend)}</strong>
      </div>
      <p className="receipt-blurb">{sample.blurb}</p>
    </div>
  )

  if (!onClick) {
    return (
      <div className="receipt-photo" style={{ transform: `rotate(${sample.rotate}deg)` }}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`receipt-photo ${active ? 'is-active' : ''}`}
      style={{ transform: `rotate(${sample.rotate}deg)` }}
      onClick={onClick}
    >
      {inner}
    </button>
  )
}

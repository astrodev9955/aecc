import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { usePlatform } from '../context/Platform'
import { MethodGlyph } from './PaymentMarks'
import { payInstructions, type PaymentDraft, type PaymentMethodId, type StoredPayment } from '../data/payments'
import { formatPlanPrice, type Plan } from '../data/plans'

export function Checkout({
  plan,
  saved,
  busy,
  cardCheckout,
  onCancel,
  onPay,
}: {
  plan: Plan
  saved?: StoredPayment | null
  busy: boolean
  cardCheckout: boolean
  onCancel: () => void
  onPay: (draft: PaymentDraft) => Promise<void>
}) {
  const { settings } = usePlatform()
  const methods = settings.payments.filter((item) => {
    if (item.enabled === false) return false
    if ((item.id === 'card' || item.id === 'apple' || item.id === 'google') && !cardCheckout) return false
    return true
  })
  const [methodId, setMethodId] = useState<PaymentMethodId | 'saved'>(saved ? 'saved' : methods[0]?.id ?? 'bank')
  const [payerEmail, setPayerEmail] = useState('')
  const [error, setError] = useState('')

  const method = methods.find((item) => item.id === methodId)

  useEffect(() => {
    if (methodId === 'saved') return
    if (!methods.some((item) => item.id === methodId) && methods[0]) setMethodId(methods[0].id)
  }, [methodId, methods])

  const preview = useMemo(() => {
    if (!method || method.id === 'card' || method.id === 'apple' || method.id === 'google') return null
    return payInstructions(method, 'CIR-XXXX', plan.price)
  }, [method, plan.price])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!methods.length && !saved) {
      setError('No payment methods are available. Ask the studio to turn one on.')
      return
    }
    setError('')
    try {
      await onPay({ methodId, payerEmail: payerEmail.trim() || undefined })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment')
    }
  }

  const action =
    methodId === 'card' || methodId === 'apple' || methodId === 'google'
      ? `Continue to secure checkout · ${formatPlanPrice(plan)}`
      : `Create invoice · ${formatPlanPrice(plan)}`

  return (
    <section className="checkout" aria-labelledby="checkout-title">
      <header className="checkout-head">
        <div>
          <p className="eyebrow">Checkout</p>
          <h2 id="checkout-title">Start {plan.name}</h2>
          <p className="muted">Monthly subscription. You get an invoice. Cancel before the next renewal.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </header>

      <div className="checkout-layout">
        <aside className="checkout-summary">
          <p className="eyebrow">Order</p>
          <h3>{plan.name}</h3>
          <p className="checkout-price">{formatPlanPrice(plan)}</p>
          <ul>
            {plan.features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="muted tiny">
            First invoice is for the next 30 days. Card payments go to Stripe. Bank, PayPal, Wise, and wallets create
            an invoice the studio marks paid.
          </p>
        </aside>

        <form className="checkout-form" onSubmit={(e) => void submit(e)}>
          {error ? <p className="banner warn">{error}</p> : null}

          <fieldset className="pay-method-grid">
            <legend>Payment method</legend>
            {saved ? (
              <label className={`pay-method ${methodId === 'saved' ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="pay-method"
                  checked={methodId === 'saved'}
                  onChange={() => setMethodId('saved')}
                />
                <MethodGlyph methodId={saved.methodId} />
                <span>
                  <strong>Saved method</strong>
                  <small>{saved.label}</small>
                </span>
              </label>
            ) : null}
            {methods.map((item) => (
              <label key={item.id} className={`pay-method ${methodId === item.id ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="pay-method"
                  checked={methodId === item.id}
                  onChange={() => setMethodId(item.id)}
                />
                <MethodGlyph methodId={item.id} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.blurb}</small>
                </span>
              </label>
            ))}
          </fieldset>

          {methodId === 'card' || methodId === 'apple' || methodId === 'google' ? (
            <p className="pay-wallet-note">
              Circular never sees the card number. You will finish on Stripe’s checkout page, then return here with a
              receipt.
            </p>
          ) : null}

          {method && method.kind === 'email' ? (
            <div className="pay-fields">
              <label className="full">
                Your {method.name} email (optional)
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="So the studio can match the payment"
                />
              </label>
            </div>
          ) : null}

          {preview ? (
            <div className="pay-to">
              <h3>{preview.title}</h3>
              <dl>
                {preview.lines.map((line) => (
                  <div key={line.label}>
                    <dt>{line.label}</dt>
                    <dd>{line.value}</dd>
                  </div>
                ))}
              </dl>
              <p>{preview.note.replace('CIR-XXXX', 'the invoice number we issue next')}</p>
            </div>
          ) : null}

          {methodId === 'saved' && saved ? (
            <p className="pay-wallet-note">We will issue the next invoice against {saved.label}.</p>
          ) : null}

          {!cardCheckout && !methods.length ? (
            <p className="banner warn">
              No live payment method is configured. Ask an admin to add bank details or Stripe keys.
            </p>
          ) : null}

          <button type="submit" className="btn" disabled={busy || (!methods.length && !saved)}>
            {busy ? 'Working…' : action}
          </button>
        </form>
      </div>
    </section>
  )
}

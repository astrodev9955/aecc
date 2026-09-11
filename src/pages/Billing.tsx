import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Checkout } from '../components/Checkout'
import { PaymentMarks } from '../components/PaymentMarks'
import { useAuth } from '../context/Auth'
import { usePlatform } from '../context/Platform'
import { isPlanId, formatPlanPrice, type PlanId } from '../data/plans'
import { isPaymentMethodId, type PaymentDraft } from '../data/payments'
import { getBillingAccount, type BillingInvoice } from '../lib/api'
import { toast } from '../lib/toast'

function when(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusLabel(status: string) {
  if (status === 'trialing') return 'Trial'
  if (status === 'expired') return 'Trial ended'
  if (status === 'canceling') return 'Cancels at period end'
  if (status === 'pending_payment') return 'Awaiting payment'
  return 'Active'
}

export default function Billing() {
  const { user, subscribe, confirmCheckout, cancelPlan, resumePlan } = useAuth()
  const { settings } = usePlatform()
  const plans = settings.plans.filter((plan) => plan.enabled !== false && plan.id !== 'free' && plan.price > 0)
  const [params, setParams] = useSearchParams()
  const requested = params.get('checkout')
  const sessionId = params.get('session_id')
  const [busy, setBusy] = useState<PlanId | 'cancel' | 'resume' | 'stripe' | null>(null)
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [open, setOpen] = useState<BillingInvoice | null>(null)
  const [cardCheckout, setCardCheckout] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(
    requested && isPlanId(requested) && requested !== 'free' ? requested : null,
  )
  const checkoutRef = useRef<HTMLDivElement>(null)
  const current = user?.planId && user.planId !== 'free' ? user.planId : 'studio'
  const checkout = settings.plans.find((plan) => plan.id === checkoutPlan)

  useEffect(() => {
    void getBillingAccount()
      .then((data) => {
        setInvoices(data.invoices)
        setOpen(data.open)
        setCardCheckout(Boolean(data.cardCheckout))
      })
      .catch(() => undefined)
  }, [user?.planId, user?.planStatus, user?.pendingPlanId])

  useEffect(() => {
    if (checkoutPlan) return
    const pending = user?.pendingPlanId
    if (pending && pending !== 'free' && pending !== current) setCheckoutPlan(pending)
  }, [checkoutPlan, current, user?.pendingPlanId])

  useEffect(() => {
    if (checkout) checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [checkout])

  useEffect(() => {
    if (!sessionId) return
    let alive = true
    setBusy('stripe')
    void confirmCheckout(sessionId)
      .then(async () => {
        const data = await getBillingAccount()
        if (!alive) return
        setInvoices(data.invoices)
        setOpen(data.open)
        toast('Payment received. Subscription is active.')
        setParams({}, { replace: true })
        setCheckoutPlan(null)
      })
      .catch((err: unknown) => {
        if (alive) toast(err instanceof Error ? err.message : 'Stripe has not confirmed this payment yet')
      })
      .finally(() => {
        if (alive) setBusy(null)
      })
    return () => {
      alive = false
    }
    // confirmCheckout is stable enough for a one-shot Stripe return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  function openCheckout(planId: PlanId) {
    setCheckoutPlan(planId)
    setParams({ checkout: planId }, { replace: true })
  }

  function closeCheckout() {
    setCheckoutPlan(null)
    setParams({}, { replace: true })
  }

  async function choose(planId: PlanId) {
    if (planId === 'free') return
    const lockedIn = current === planId && (user?.planStatus === 'active' || user?.planStatus === 'canceling')
    if (lockedIn) return
    openCheckout(planId)
  }

  async function pay(draft: PaymentDraft) {
    if (!checkoutPlan || checkoutPlan === 'free') return
    setBusy(checkoutPlan)
    try {
      const data = await subscribe(checkoutPlan, draft)
      setInvoices(data.invoices)
      setOpen(data.open)
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl)
        return
      }
      closeCheckout()
      toast(`Invoice ${data.open?.number ?? ''} is ready. Pay it to start ${data.open?.planName ?? 'the plan'}.`)
    } finally {
      setBusy(null)
    }
  }

  async function onCancel() {
    const endingTrial = user?.planStatus === 'trialing'
    if (
      !window.confirm(
        endingTrial
          ? 'End the trial now? The ledger stays visible, but new tickets stay locked until you subscribe.'
          : 'Cancel at the end of this period? You keep access until the renewal date.',
      )
    ) {
      return
    }
    setBusy('cancel')
    try {
      await cancelPlan()
      toast(endingTrial ? 'Trial ended' : 'Subscription will end at the renewal date')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not cancel')
    } finally {
      setBusy(null)
    }
  }

  async function onResume() {
    setBusy('resume')
    try {
      await resumePlan()
      toast('Subscription will renew')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not resume')
    } finally {
      setBusy(null)
    }
  }

  const pendingName = settings.plans.find((plan) => plan.id === user?.pendingPlanId)?.name

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Billing</p>
          <h1>Subscription</h1>
          <p className="muted">
          Monthly Studio and Firm. New accounts start on a {settings.trialDays}-day trial of the plan they pick.
          </p>
        </div>
      </header>

      <section className="billing-status">
        <div>
          <p className="eyebrow">{statusLabel(user?.planStatus ?? 'active')}</p>
          <h2>{user?.planName ?? 'Studio'}</h2>
          <p className="muted">
            {user?.planStatus === 'trialing'
              ? `${user.trialDaysLeft} day${user.trialDaysLeft === 1 ? '' : 's'} left on the full ${user.planName} ledger.`
              : user?.planStatus === 'expired'
                ? 'The trial has ended. Existing jobs stay visible. Subscribe to log new tickets.'
                : user?.limits.maxProjects != null
                  ? `${user.usage.projects} / ${user.limits.maxProjects} projects`
                  : `${user?.usage.projects ?? 0} projects`}
            {user?.planStatus !== 'trialing' && user?.planStatus !== 'expired'
              ? user?.limits.maxReceipts != null
                ? ` · ${user.usage.receipts} / ${user.limits.maxReceipts} invoices`
                : ` · ${user?.usage.receipts ?? 0} supplier invoices`
              : ''}
          </p>
          {user?.payment ? <p className="billing-method">On file · {user.payment.label}</p> : null}
        </div>
        <dl className="billing-dates">
          <div>
            <dt>Started</dt>
            <dd>{when(user?.planStartedAt) || '—'}</dd>
          </div>
          <div>
            <dt>
              {user?.planStatus === 'trialing'
                ? 'Trial ends'
                : user?.planStatus === 'expired'
                  ? 'Trial ended'
                  : user?.planStatus === 'canceling'
                    ? 'Access until'
                    : 'Renews'}
            </dt>
            <dd>{when(user?.trialEndsAt || user?.planCancelAt || user?.planRenewsAt) || '—'}</dd>
          </div>
        </dl>
        <div className="billing-status-actions">
          {user?.planStatus === 'trialing' || user?.planStatus === 'active' ? (
            <button type="button" className="btn btn-ghost" disabled={busy != null} onClick={() => void onCancel()}>
              {busy === 'cancel'
                ? 'Canceling…'
                : user?.planStatus === 'trialing'
                  ? 'End trial'
                  : 'Cancel at period end'}
            </button>
          ) : null}
          {user?.planStatus === 'canceling' ? (
            <button type="button" className="btn" disabled={busy != null} onClick={() => void onResume()}>
              {busy === 'resume' ? 'Resuming…' : 'Keep subscription'}
            </button>
          ) : null}
        </div>
      </section>

      {open ? (
        <section className="billing-open">
          <header>
            <div>
              <p className="eyebrow">Open invoice</p>
              <h2>
                {open.number} · {open.planName}
              </h2>
              <p className="muted">
                ${open.amount} {open.currency} · {open.methodName} · due to start {when(open.periodStart)}
                {pendingName ? ` · waiting to activate ${pendingName}` : ''}
              </p>
            </div>
          </header>
          {open.payTo ? (
            <div className="pay-to">
              <h3>{open.payTo.title}</h3>
              <dl>
                {open.payTo.lines.map((line) => (
                  <div key={line.label}>
                    <dt>{line.label}</dt>
                    <dd>{line.value}</dd>
                  </div>
                ))}
              </dl>
              <p>{open.payTo.note}</p>
            </div>
          ) : (
            <p className="muted">Finish card checkout if the Stripe window is still open, or wait for the studio to mark this paid.</p>
          )}
        </section>
      ) : null}

      <div className="plan-grid">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`plan-card ${current === plan.id ? 'is-current' : ''} ${plan.recommended ? 'is-recommended' : ''} ${checkoutPlan === plan.id ? 'is-checkout' : ''}`}
          >
            {plan.recommended ? <p className="plan-ribbon">Recommended</p> : null}
            <p className="eyebrow">{formatPlanPrice(plan)}</p>
            <h2>{plan.name}</h2>
            <p className="muted">{plan.blurb}</p>
            <p className="plan-audience">{plan.audience}</p>
            <ul>
              {plan.features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="plan-note">{plan.note}</p>
            <button
              type="button"
              className={current === plan.id && (user?.planStatus === 'active' || user?.planStatus === 'canceling') ? 'btn btn-ghost' : 'btn'}
              disabled={
                (current === plan.id && (user?.planStatus === 'active' || user?.planStatus === 'canceling')) || busy != null
              }
              onClick={() => void choose(plan.id)}
            >
              {current === plan.id && (user?.planStatus === 'active' || user?.planStatus === 'canceling')
                ? 'Current plan'
                : busy === plan.id
                  ? 'Working…'
                  : `Subscribe · ${formatPlanPrice(plan)}`}
            </button>
          </article>
        ))}
      </div>

      {checkout ? (
        <div ref={checkoutRef}>
          <Checkout
            plan={checkout}
            saved={
              user?.payment && isPaymentMethodId(user.payment.methodId)
                ? {
                    methodId: user.payment.methodId,
                    methodName: user.payment.methodName,
                    label: user.payment.label,
                  }
                : null
            }
            busy={busy === checkout.id}
            cardCheckout={cardCheckout}
            onCancel={closeCheckout}
            onPay={pay}
          />
        </div>
      ) : null}

      <section className="billing-invoices">
        <p className="eyebrow">Receipts</p>
        <h2 className="subhead">Subscription invoices</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.number}
                    <div className="muted tiny">{item.methodName}</div>
                  </td>
                  <td>{item.planName}</td>
                  <td>
                    ${item.amount} {item.currency}
                  </td>
                  <td>
                    {when(item.periodStart)} – {when(item.periodEnd)}
                  </td>
                  <td>{item.status}</td>
                </tr>
              ))}
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No subscription invoices yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="billing-pay">
        <p className="eyebrow">Accepted methods</p>
        <PaymentMarks />
      </div>
    </div>
  )
}

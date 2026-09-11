import Stripe from 'stripe'
import type { PaymentMethod, PaymentMethodId } from '../src/data/payments.ts'
import { getPaymentMethod, isPaymentMethodId, payInstructions, type PayInstructions } from '../src/data/payments.ts'
import type { Plan } from '../src/data/plans.ts'
import { addDays, isPaidPlanId } from '../src/data/plans.ts'
import { collections, ObjectId, type BillingInvoiceDoc, type UserDoc } from './db.ts'
import { getPlan, isPlanId } from './plans.ts'
import { platform } from './platform.ts'

export class BillingError extends Error {
  status = 400
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface BillingInvoice {
  id: string
  number: string
  planId: string
  planName: string
  amount: number
  currency: string
  status: BillingInvoiceDoc['status']
  methodId: string
  methodName: string
  label: string
  reference: string
  periodStart: string
  periodEnd: string
  payerEmail?: string
  notes?: string
  createdAt: string
  paidAt?: string
  payTo: PayInstructions | null
}

export function addMonth(from: Date): Date {
  const next = new Date(from.getTime())
  next.setMonth(next.getMonth() + 1)
  return next
}

export function serializeInvoice(doc: BillingInvoiceDoc, method?: PaymentMethod): BillingInvoice {
  const live = method ?? platform().payments.find((item) => item.id === doc.methodId) ?? getPaymentMethod(doc.methodId)
  return {
    id: doc._id.toHexString(),
    number: doc.number,
    planId: doc.planId,
    planName: doc.planName,
    amount: doc.amount,
    currency: doc.currency,
    status: doc.status,
    methodId: doc.methodId,
    methodName: doc.methodName,
    label: doc.label,
    reference: doc.reference,
    periodStart: doc.periodStart.toISOString(),
    periodEnd: doc.periodEnd.toISOString(),
    payerEmail: doc.payerEmail,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
    paidAt: doc.paidAt?.toISOString(),
    payTo: live && doc.status === 'open' ? payInstructions(live, doc.reference, doc.amount) : null,
  }
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getUTCFullYear()
  const prefix = `CIR-${year}-`
  const latest = await collections()
    .invoices.find({ number: { $regex: `^${prefix}` } })
    .sort({ number: -1 })
    .limit(1)
    .toArray()
  const last = latest[0]?.number.slice(prefix.length) ?? '0000'
  const next = String(Number(last) + 1).padStart(4, '0')
  return `${prefix}${next}`
}

export function livePayment(id: string): PaymentMethod | undefined {
  return platform().payments.find((item) => item.id === id)
}

export function stripeSecret(method?: PaymentMethod): string {
  const card = method?.id === 'card' ? method : livePayment('card')
  if (!card) return ''
  const processor = (card.integration.processor || 'stripe').toLowerCase()
  if (processor !== 'stripe') return ''
  return card.integration.secretKey?.trim() ?? ''
}

export function cardCheckoutReady(): boolean {
  return Boolean(stripeSecret())
}

export function publicOrigin(reqOrigin?: string): string {
  return (
    process.env.APP_URL?.replace(/\/$/, '') ||
    reqOrigin?.replace(/\/$/, '') ||
    'http://127.0.0.1:5173'
  )
}

async function voidOpenInvoices(userId: ObjectId): Promise<void> {
  await collections().invoices.updateMany(
    { userId, status: 'open' },
    { $set: { status: 'void' } },
  )
}

export async function createInvoice(input: {
  user: UserDoc
  plan: Plan
  methodId: PaymentMethodId
  payerEmail?: string
  notes?: string
}): Promise<BillingInvoiceDoc> {
  await voidOpenInvoices(input.user._id)
  const method = livePayment(input.methodId) ?? getPaymentMethod(input.methodId)
  if (!method || method.enabled === false) {
    throw new BillingError(400, 'That payment method is turned off')
  }
  const now = new Date()
  const number = await nextInvoiceNumber()
  const doc: BillingInvoiceDoc = {
    _id: new ObjectId(),
    userId: input.user._id,
    number,
    planId: input.plan.id,
    planName: input.plan.name,
    amount: input.plan.price,
    currency: 'USD',
    status: 'open',
    methodId: method.id,
    methodName: method.name,
    label: `${method.name} · ${number}`,
    reference: number,
    periodStart: now,
    periodEnd: addMonth(now),
    payerEmail: input.payerEmail,
    notes: input.notes,
    createdAt: now,
  }
  await collections().invoices.insertOne(doc)
  return doc
}

export async function activatePaidPlan(input: {
  user: UserDoc
  invoice: BillingInvoiceDoc
  stripeSubscriptionId?: string
}): Promise<UserDoc> {
  const now = new Date()
  const periodEnd = input.invoice.periodEnd > now ? input.invoice.periodEnd : addMonth(now)
  await collections().invoices.updateOne(
    { _id: input.invoice._id },
    {
      $set: {
        status: 'paid',
        paidAt: now,
        stripeSubscriptionId: input.stripeSubscriptionId ?? input.invoice.stripeSubscriptionId,
      },
    },
  )
  const method = livePayment(input.invoice.methodId) ?? getPaymentMethod(input.invoice.methodId)
  const $set: Record<string, unknown> = {
    planId: input.invoice.planId,
    planStatus: 'active',
    planStartedAt: input.user.planId === input.invoice.planId && input.user.planStatus === 'active' ? input.user.planStartedAt : now,
    planRenewsAt: periodEnd,
    planCancelAt: null,
    pendingPlanId: null,
    payment: {
      methodId: input.invoice.methodId,
      methodName: input.invoice.methodName,
      label: method ? `${method.name} · ${input.invoice.number}` : input.invoice.label,
      email: input.invoice.payerEmail,
      updatedAt: now,
    },
  }
  await collections().users.updateOne({ _id: input.user._id }, { $set, $unset: { trialEndsAt: '' } })
  const next = await collections().users.findOne({ _id: input.user._id })
  if (!next) throw new BillingError(404, 'Account not found')
  return next
}

export async function expireAccount(user: UserDoc, options?: { keepInvoices?: boolean }): Promise<UserDoc> {
  if (!options?.keepInvoices) await voidOpenInvoices(user._id)
  const now = new Date()
  await collections().users.updateOne(
    { _id: user._id },
    {
      $set: {
        planId: isPaidPlanId(user.planId) ? user.planId : 'studio',
        planStatus: 'expired',
        pendingPlanId: options?.keepInvoices ? user.pendingPlanId ?? null : null,
        planCancelAt: now,
      },
      $unset: { planRenewsAt: '' },
    },
  )
  const next = await collections().users.findOne({ _id: user._id })
  if (!next) throw new BillingError(404, 'Account not found')
  return next
}

export async function cancelAtPeriodEnd(user: UserDoc): Promise<UserDoc> {
  if (user.planStatus === 'expired') throw new BillingError(400, 'This account already needs a paid plan')
  if (user.planStatus === 'trialing' || user.planStatus === 'pending_payment' || user.planId === 'free') {
    return expireAccount(user)
  }
  const ends = user.planRenewsAt ?? addMonth(user.planStartedAt)
  await collections().users.updateOne(
    { _id: user._id },
    { $set: { planStatus: 'canceling', planCancelAt: ends, pendingPlanId: null } },
  )
  const next = await collections().users.findOne({ _id: user._id })
  if (!next) throw new BillingError(404, 'Account not found')
  return next
}

export async function resumeSubscription(user: UserDoc): Promise<UserDoc> {
  if (user.planStatus !== 'canceling') throw new BillingError(400, 'This subscription is not set to cancel')
  await collections().users.updateOne(
    { _id: user._id },
    { $set: { planStatus: 'active' }, $unset: { planCancelAt: '' } },
  )
  const next = await collections().users.findOne({ _id: user._id })
  if (!next) throw new BillingError(404, 'Account not found')
  return next
}

export async function applySubscriptionState(user: UserDoc): Promise<UserDoc> {
  const now = new Date()
  if (user.role === 'admin' && (user.planId === 'free' || user.planStatus === 'expired' || user.planStatus === 'trialing')) {
    await collections().users.updateOne(
      { _id: user._id },
      {
        $set: { planId: 'firm', planStatus: 'active', pendingPlanId: null },
        $unset: { trialEndsAt: '', planCancelAt: '' },
      },
    )
    return (await collections().users.findOne({ _id: user._id })) ?? user
  }

  if (user.planId === 'free') {
    const trialEnd = user.trialEndsAt ?? addDays(user.createdAt, platform().trialDays)
    const stillTrial = trialEnd > now
    await collections().users.updateOne(
      { _id: user._id },
      {
        $set: {
          planId: 'studio',
          planStatus: stillTrial ? 'trialing' : 'expired',
          trialEndsAt: trialEnd,
          pendingPlanId: stillTrial ? user.pendingPlanId : null,
        },
      },
    )
    return (await collections().users.findOne({ _id: user._id })) ?? user
  }

  if (user.planStatus === 'trialing' && user.trialEndsAt && user.trialEndsAt <= now) {
    return expireAccount(user, { keepInvoices: true })
  }

  if (user.planStatus === 'canceling' && user.planCancelAt && user.planCancelAt <= now) {
    return expireAccount(user)
  }

  if (user.planStatus === 'active' && user.planRenewsAt && user.planRenewsAt <= now) {
    const covering = await collections().invoices.findOne({
      userId: user._id,
      status: 'paid',
      periodStart: { $lte: now },
      periodEnd: { $gt: now },
    })
    if (!covering) {
      const open = await collections().invoices.findOne({ userId: user._id, status: 'open' })
      if (!open && isPlanId(user.planId)) {
        const plan = getPlan(user.planId)
        if (plan.price > 0) {
          const methodId = isPaymentMethodId(user.payment?.methodId ?? '') ? user.payment!.methodId : 'bank'
          await createInvoice({
            user,
            plan,
            methodId: methodId as PaymentMethodId,
            payerEmail: user.payment?.email,
            notes: 'Renewal',
          })
        }
      }
    }
  }
  return (await collections().users.findOne({ _id: user._id })) ?? user
}

export async function migratePricingModel(): Promise<void> {
  const free = await collections().users.find({ planId: 'free' }).toArray()
  for (const user of free) {
    await applySubscriptionState(user)
  }
  const due = await collections()
    .users.find({ planStatus: 'trialing', trialEndsAt: { $lte: new Date() } })
    .toArray()
  for (const user of due) {
    await expireAccount(user, { keepInvoices: true })
  }
}

export async function invoicesForUser(userId: ObjectId): Promise<BillingInvoice[]> {
  const rows = await collections().invoices.find({ userId }).sort({ createdAt: -1 }).limit(40).toArray()
  return rows.map((row) => serializeInvoice(row))
}

export async function openInvoiceFor(userId: ObjectId): Promise<BillingInvoiceDoc | null> {
  return collections().invoices.findOne({ userId, status: 'open' }, { sort: { createdAt: -1 } })
}

export async function startStripeCheckout(input: {
  user: UserDoc
  plan: Plan
  invoice: BillingInvoiceDoc
  origin: string
}): Promise<string> {
  const secret = stripeSecret()
  if (!secret) throw new BillingError(400, 'Card checkout is not connected. Use a bank transfer or ask the studio to add Stripe keys.')
  const stripe = new Stripe(secret)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: input.user.email,
    client_reference_id: input.user._id.toHexString(),
    success_url: `${input.origin}/app/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/app/billing?checkout=${input.plan.id}`,
    metadata: {
      userId: input.user._id.toHexString(),
      invoiceId: input.invoice._id.toHexString(),
      planId: input.plan.id,
    },
    subscription_data: {
      metadata: {
        userId: input.user._id.toHexString(),
        invoiceId: input.invoice._id.toHexString(),
        planId: input.plan.id,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(input.plan.price * 100),
          recurring: { interval: 'month' },
          product_data: {
            name: `Circular ${input.plan.name}`,
            description: `${input.plan.blurb} Billed monthly. Cancel before renewal.`,
          },
        },
      },
    ],
  })
  if (!session.url) throw new BillingError(502, 'Stripe did not return a checkout URL')
  await collections().invoices.updateOne({ _id: input.invoice._id }, { $set: { stripeSessionId: session.id } })
  if (session.customer && typeof session.customer === 'string') {
    await collections().users.updateOne({ _id: input.user._id }, { $set: { stripeCustomerId: session.customer } })
  }
  return session.url
}

export async function confirmStripeSession(sessionId: string): Promise<UserDoc | null> {
  const secret = stripeSecret()
  if (!secret) throw new BillingError(400, 'Card checkout is not connected')
  const stripe = new Stripe(secret)
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw new BillingError(400, 'Stripe has not completed this payment yet')
  }
  return fulfillStripeSession(session)
}

export async function fulfillStripeSession(session: Stripe.Checkout.Session): Promise<UserDoc | null> {
  const invoiceId = session.metadata?.invoiceId
  const userId = session.metadata?.userId
  if (!invoiceId || !userId) return null
  const invoice = await collections().invoices.findOne({ _id: new ObjectId(invoiceId) })
  const user = await collections().users.findOne({ _id: new ObjectId(userId) })
  if (!invoice || !user) return null
  if (invoice.status === 'paid') return user
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  return activatePaidPlan({ user, invoice, stripeSubscriptionId: subscriptionId })
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
  const card = livePayment('card')
  const secret = stripeSecret(card)
  const webhookSecret = card?.integration.webhookSecret?.trim() ?? ''
  if (!secret || !webhookSecret) throw new BillingError(400, 'Stripe webhook is not configured')
  const stripe = new Stripe(secret)
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  if (event.type === 'checkout.session.completed') {
    await fulfillStripeSession(event.data.object)
  }
  if (event.type === 'customer.subscription.deleted') {
    const userId = event.data.object.metadata?.userId
    if (!userId) return
    const user = await collections().users.findOne({ _id: new ObjectId(userId) })
    if (user) await expireAccount(user)
  }
}

export function methodFromDraft(methodId: string, existing?: UserDoc['payment']): PaymentMethodId {
  if (methodId === 'saved') {
    const saved = existing?.methodId ?? ''
    if (!isPaymentMethodId(saved)) throw new BillingError(400, 'No saved payment method on this account')
    return saved
  }
  if (!isPaymentMethodId(methodId)) throw new BillingError(400, 'Choose a payment method')
  return methodId
}

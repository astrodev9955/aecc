export type PlanId = 'free' | 'studio' | 'firm'

export const TRIAL_DAYS = 14

export function isPaidPlanId(value: string): value is 'studio' | 'firm' {
  return value === 'studio' || value === 'firm'
}

export function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime())
  next.setDate(next.getDate() + days)
  return next
}

export function trialDaysLeft(endsAt: Date | string | undefined, now = new Date()): number {
  if (!endsAt) return 0
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000))
}

export function subscriptionIsOpen(status: string | undefined): boolean {
  return status === 'trialing' || status === 'active' || status === 'canceling'
}

export interface Plan {
  id: PlanId
  name: string
  price: number
  cadence: string
  blurb: string
  audience: string
  bestFor: string
  note: string
  recommended?: boolean
  maxProjects: number | null
  maxReceipts: number | null
  canExport: boolean
  canShare: boolean
  canPortfolio: boolean
  enabled: boolean
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    cadence: 'ended',
    blurb: 'Legacy locked workspace after a trial. Not offered to new accounts.',
    audience: 'Read-only leftover files.',
    bestFor: 'Not sold.',
    note: 'Hidden from checkout. Existing files stay visible; new tickets need Studio or Firm.',
    maxProjects: 1,
    maxReceipts: 12,
    canExport: false,
    canShare: false,
    canPortfolio: false,
    enabled: false,
    features: [
      '1 project on the ledger',
      '12 supplier invoices',
      'Cloud invoice reading',
      'Material library + carbon / salvage',
      'Print the birth certificate',
      'Share link and export stay locked',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 49,
    cadence: 'month',
    blurb: 'For a superintendent running several jobs.',
    audience: 'Keep a handful of buildings in one account.',
    bestFor: 'Site teams and small practices with 2–8 live jobs.',
    note: '14-day trial of the full Studio ledger, then $49/month. Cancel before renewal.',
    recommended: true,
    maxProjects: 8,
    maxReceipts: null,
    canExport: true,
    canShare: true,
    canPortfolio: false,
    enabled: true,
    features: [
      `${TRIAL_DAYS}-day trial of every Studio feature`,
      '8 projects',
      'Unlimited supplier invoices',
      'Shareable read-only passport',
      'CSV and JSON export',
      'Cloud invoice reading',
      'Cancel anytime before renewal',
    ],
  },
  {
    id: 'firm',
    name: 'Firm',
    price: 149,
    cadence: 'month',
    blurb: 'Office-wide ledger. No cap on buildings.',
    audience: 'Every job in the office, one sign-in.',
    bestFor: 'GCs, developers, and multi-job portfolios.',
    note: '14-day trial of the office rollup, then $149/month. Cancel before renewal.',
    maxProjects: null,
    maxReceipts: null,
    canExport: true,
    canShare: true,
    canPortfolio: true,
    enabled: true,
    features: [
      `${TRIAL_DAYS}-day trial of the office rollup`,
      'Unlimited projects',
      'Portfolio rollup across every job',
      'Shareable read-only passports',
      'CSV and JSON export',
      'Unlimited supplier invoices',
      'Cancel anytime before renewal',
    ],
  },
]

export const PLAN_RECOMMENDATIONS = [
  {
    planId: 'studio' as PlanId,
    kicker: 'Start here',
    title: 'Fourteen days on the working set.',
    quote:
      'Open a job, photograph the dock, issue a revision. After the trial, Studio is $49/month — the usual home for a superintendent.',
    who: 'Small practice / site team',
  },
  {
    planId: 'firm' as PlanId,
    kicker: 'The office',
    title: 'Trial the whole portfolio.',
    quote:
      'Every building in one rollup for two weeks, then $149/month if the office stays.',
    who: 'GC · developer · firm',
  },
]

export function getPlan(id: string | null | undefined): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS.find((plan) => plan.id === 'studio') ?? PLANS[0]!
}

export function isPlanId(value: string): value is PlanId {
  return PLANS.some((plan) => plan.id === value)
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.price === 0) return 'Free'
  return `$${plan.price}/${plan.cadence}`
}

export function limitLabel(max: number | null, unit: string): string {
  if (max == null) return `Unlimited ${unit}`
  return `${max} ${unit}`
}

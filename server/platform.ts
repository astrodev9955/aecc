import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { collections } from './db.ts'
import { defaultPlatform, type PlatformSettings } from '../src/data/platform.ts'
import { isPlanId, type Plan, type PlanId } from '../src/data/plans.ts'
import { integrationFields, isPaymentMethodId } from '../src/data/payments.ts'

const SETTINGS_ID = 'platform'

let cache: PlatformSettings = defaultPlatform()

export function platform(): PlatformSettings {
  return cache
}

export function listPlans(): Plan[] {
  return cache.plans
}

export function getPlan(id: string | null | undefined): Plan {
  const plans = cache.plans.length ? cache.plans : defaultPlatform().plans
  return plans.find((plan) => plan.id === id) ?? plans.find((plan) => plan.id === 'studio') ?? plans[0]!
}

export function isLivePlanId(value: string): value is PlanId {
  return cache.plans.some((plan) => plan.id === value) || isPlanId(value)
}

export async function loadPlatform(): Promise<PlatformSettings> {
  const doc = await collections().settings.findOne({ _id: SETTINGS_ID })
  cache = mergeSettings(doc)
  if (!doc) {
    await collections().settings.updateOne({ _id: SETTINGS_ID }, { $set: { ...cache, updatedAt: new Date() } }, { upsert: true })
  }
  return cache
}

export async function savePlatform(next: PlatformSettings): Promise<PlatformSettings> {
  cache = mergeSettings(next)
  await collections().settings.updateOne(
    { _id: SETTINGS_ID },
    { $set: { ...cache, updatedAt: new Date() } },
    { upsert: true },
  )
  return cache
}

export async function saveUpload(file: { originalname: string; buffer: Buffer; mimetype: string }, root: string): Promise<string> {
  const ext = extname(file.originalname).toLowerCase()
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'])
  if (!allowed.has(ext)) throw new Error('Use a JPG, PNG, WebP, SVG, or GIF')
  if (!file.mimetype.startsWith('image/') && ext !== '.svg') throw new Error('Upload an image file')
  const dir = join(root, 'data', 'uploads')
  await mkdir(dir, { recursive: true })
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  await writeFile(join(dir, name), file.buffer)
  return `/uploads/${name}`
}

function mergeSettings(raw: unknown): PlatformSettings {
  const base = defaultPlatform()
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Partial<PlatformSettings>
  return {
    trialDays: clamp(Number(input.trialDays) || base.trialDays, 1, 90),
    plans: mergePlans(base.plans, input.plans),
    recommendations: mergeRecommendations(base.recommendations, input.recommendations),
    payments: mergePayments(base.payments, input.payments),
    hero: {
      intervalMs: clamp(Number(input.hero?.intervalMs) || base.hero.intervalMs, 2000, 20000),
      slides: Array.isArray(input.hero?.slides) && input.hero.slides.length > 0 ? input.hero.slides : base.hero.slides,
    },
    partners: {
      eyebrow: input.partners?.eyebrow?.trim() || base.partners.eyebrow,
      title: input.partners?.title?.trim() || base.partners.title,
      items: Array.isArray(input.partners?.items) && input.partners.items.length > 0 ? input.partners.items : base.partners.items,
    },
  }
}

function mergeRecommendations(
  defaults: PlatformSettings['recommendations'],
  incoming: PlatformSettings['recommendations'] | undefined,
): PlatformSettings['recommendations'] {
  if (!Array.isArray(incoming)) return defaults
  const next = incoming.filter((item) => item.planId === 'studio' || item.planId === 'firm')
  return next.length >= 2 ? next : defaults
}

function mergePlans(defaults: Plan[], incoming: Plan[] | undefined): Plan[] {
  if (!Array.isArray(incoming)) return defaults
  return defaults.map((plan) => {
    const next = incoming.find((item) => item.id === plan.id)
    if (!next) return plan
    return {
      ...plan,
      name: String(next.name || plan.name),
      price: Math.max(0, Number(next.price) || 0),
      cadence: String(next.cadence || plan.cadence),
      blurb: String(next.blurb ?? plan.blurb),
      audience: String(next.audience ?? plan.audience),
      bestFor: String(next.bestFor ?? plan.bestFor),
      note: String(next.note ?? plan.note),
      recommended: Boolean(next.recommended),
      maxProjects: optionalLimit(next.maxProjects),
      maxReceipts: optionalLimit(next.maxReceipts),
      canExport: Boolean(next.canExport),
      canShare: next.canShare === undefined ? plan.canShare : Boolean(next.canShare),
      canPortfolio: next.canPortfolio === undefined ? plan.canPortfolio : Boolean(next.canPortfolio),
      enabled: plan.id === 'free' ? false : next.enabled !== false,
      features: Array.isArray(next.features) ? next.features.map(String).filter(Boolean) : plan.features,
    }
  }).map((plan, _, all) => {
    const recommended = all.find((item) => item.recommended)
    return recommended ? { ...plan, recommended: plan.id === recommended.id } : plan
  })
}

function mergePayments(defaults: PlatformSettings['payments'], incoming: PlatformSettings['payments'] | undefined) {
  if (!Array.isArray(incoming)) return defaults
  return defaults.map((method) => {
    const next = incoming.find((item) => item.id === method.id)
    if (!next || !isPaymentMethodId(next.id)) return method
    return {
      ...method,
      name: String(next.name || method.name),
      blurb: String(next.blurb ?? method.blurb),
      enabled: next.enabled !== false,
      showMark: next.showMark !== false,
      integration: mergeIntegration(method.id, method.integration, next.integration),
    }
  })
}

function mergeIntegration(
  id: PlatformSettings['payments'][number]['id'],
  current: Record<string, string> | undefined,
  incoming: Record<string, string> | undefined,
): Record<string, string> {
  const allowed = new Set(integrationFields(id).map((field) => field.key))
  const next: Record<string, string> = { ...(current ?? {}) }
  if (!incoming || typeof incoming !== 'object') return next
  for (const [key, value] of Object.entries(incoming)) {
    if (!allowed.has(key)) continue
    next[key] = typeof value === 'string' ? value.trim() : ''
  }
  return next
}

function optionalLimit(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

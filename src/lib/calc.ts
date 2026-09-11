import type { LineItem, MaterialCategory, Project, Receipt, Recoverability } from '../types'
import { getMaterial } from '../data/materials'

export interface LineMetrics {
  spend: number
  carbonKg: number
  salvageUsd: number
  recoverability: Recoverability
  category: MaterialCategory
  materialName: string
}

export function metricsFor(line: LineItem): LineMetrics {
  const spec = getMaterial(line.materialId)
  return {
    spend: line.quantity * line.unitCost,
    carbonKg: line.massKg * spec.carbonPerKg,
    salvageUsd: line.massKg * spec.salvagePerKg,
    recoverability: spec.recoverability,
    category: spec.category,
    materialName: spec.name,
  }
}

export function allLines(project: Project): LineItem[] {
  return project.receipts.flatMap((r) => r.lines)
}

export interface PassportTotals {
  spend: number
  carbonKg: number
  salvageUsd: number
  massKg: number
  receiptCount: number
  lineCount: number
  recoverableShare: number
  byCategory: Record<string, { carbonKg: number; salvageUsd: number; spend: number; massKg: number }>
}

export function totals(project: Project): PassportTotals {
  const lines = allLines(project)
  const byCategory: PassportTotals['byCategory'] = {}
  let spend = 0
  let carbonKg = 0
  let salvageUsd = 0
  let massKg = 0
  let recoverableSpend = 0

  for (const line of lines) {
    const m = metricsFor(line)
    spend += m.spend
    carbonKg += m.carbonKg
    salvageUsd += m.salvageUsd
    massKg += line.massKg
    if (m.recoverability === 'high') recoverableSpend += m.spend
    else if (m.recoverability === 'medium') recoverableSpend += m.spend * 0.45

    const bucket = byCategory[m.category] ?? { carbonKg: 0, salvageUsd: 0, spend: 0, massKg: 0 }
    bucket.carbonKg += m.carbonKg
    bucket.salvageUsd += m.salvageUsd
    bucket.spend += m.spend
    bucket.massKg += line.massKg
    byCategory[m.category] = bucket
  }

  return {
    spend,
    carbonKg,
    salvageUsd,
    massKg,
    receiptCount: project.receipts.length,
    lineCount: lines.length,
    recoverableShare: spend === 0 ? 0 : recoverableSpend / spend,
    byCategory,
  }
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n)
}

export function formatCarbon(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg >= 10000 ? 1 : 2)} tCO₂e`
  return `${Math.round(kg)} kgCO₂e`
}

export function formatMass(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`
  return `${Math.round(kg)} kg`
}

export function receiptSpend(receipt: Receipt): number {
  return receipt.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0)
}

export function receiptCarbon(receipt: Receipt): number {
  return receipt.lines.reduce((sum, line) => sum + metricsFor(line).carbonKg, 0)
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function carbonIntensity(carbonKg: number, areaSqft: number): string {
  if (!carbonKg || !areaSqft) return '—'
  return `${(carbonKg / areaSqft).toFixed(1)} kgCO₂e / sf logged`
}

export function applyLinePatch(line: LineItem, patch: Partial<LineItem>): LineItem {
  const next = { ...line, ...patch }
  const qtyOrUnitChanged = patch.quantity != null || patch.unit != null || patch.materialId != null
  if (qtyOrUnitChanged && patch.massKg == null) {
    const spec = getMaterial(next.materialId)
    const density = spec.densityKgPerUnit?.[next.unit]
    if (density != null) {
      next.massKg = next.quantity * density
    } else if (patch.quantity != null && line.quantity > 0) {
      next.massKg = line.massKg * (next.quantity / line.quantity)
    }
  }
  return next
}

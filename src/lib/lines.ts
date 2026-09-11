import { getMaterial } from '../data/materials'
import type { LineItem, Receipt, Unit } from '../types'

export function emptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    materialId: 'steel-sections',
    quantity: 1,
    unit: 'kg',
    unitCost: 0,
    massKg: 1,
  }
}

export function blankReceipt(partial?: Partial<Receipt>): Receipt {
  return {
    id: crypto.randomUUID(),
    supplier: '',
    invoiceNo: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    status: 'review',
    source: 'manual',
    lines: [emptyLine()],
    ...partial,
  }
}

export function normalizeUnit(raw: string | undefined): Unit {
  const unit = (raw ?? 'ea').toLowerCase()
  if (unit === 'pcs' || unit === 'pc' || unit === 'each') return 'ea'
  if (unit === 'ft' || unit === 'lf') return 'lf'
  if (unit === 'sqft' || unit === 'sf') return 'm2'
  if (unit === 'cy' || unit === 'yd3') return 'm3'
  return unit as Unit
}

export function massFor(materialId: string, quantity: number, unit: Unit, fallback = quantity): number {
  const spec = getMaterial(materialId)
  const density = spec.densityKgPerUnit?.[unit]
  return density != null ? quantity * density : fallback
}

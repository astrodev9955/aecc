export type Unit = 'kg' | 't' | 'm' | 'm2' | 'm3' | 'lf' | 'ea' | 'sheet' | 'ton'

export const UNITS: Unit[] = ['kg', 't', 'ton', 'm', 'm2', 'm3', 'lf', 'ea', 'sheet']

export const TYPOLOGIES = [
  'Mixed-use',
  'Office',
  'Multifamily',
  'Single-family',
  'Industrial',
  'Civic / cultural',
  'Healthcare',
  'Education',
  'Hospitality',
  'Other',
] as const

export type Recoverability = 'high' | 'medium' | 'low'

export type MaterialCategory =
  | 'Metals'
  | 'Concrete'
  | 'Timber'
  | 'Envelope'
  | 'MEP'
  | 'Finishes'

export interface MaterialSpec {
  id: string
  name: string
  aliases: string[]
  category: MaterialCategory
  /** kgCO2e per kg (A1–A3, indicative) */
  carbonPerKg: number
  /** USD scrap / reuse value per kg */
  salvagePerKg: number
  recoverability: Recoverability
  densityKgPerUnit?: Partial<Record<Unit, number>>
  notes: string
}

export interface LineItem {
  id: string
  description: string
  materialId: string
  quantity: number
  unit: Unit
  unitCost: number
  massKg: number
}

export interface Receipt {
  id: string
  supplier: string
  invoiceNo: string
  date: string
  location: string
  status: 'logged' | 'review'
  source: 'scan' | 'sample' | 'manual'
  postedAt?: string
  lines: LineItem[]
}

export interface Project {
  id: string
  name: string
  address: string
  typology: string
  areaSqft: number
  owner: string
  year: number
  notes?: string
  shareToken?: string
  createdAt?: string
  receipts: Receipt[]
}

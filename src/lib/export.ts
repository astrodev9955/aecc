import type { Project } from '../types'
import { metricsFor, totals } from './calc'

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function projectToJson(project: Project): string {
  return JSON.stringify(
    {
      tool: 'Circular',
      kind: 'material-passport',
      issued: new Date().toISOString(),
      project,
      totals: totals(project),
    },
    null,
    2,
  )
}

function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function inventoryCsv(project: Project): string {
  const header = [
    'Supplier',
    'Invoice',
    'Date',
    'Description',
    'Material',
    'Category',
    'Qty',
    'Unit',
    'UnitCost',
    'MassKg',
    'CarbonKg',
    'SalvageUsd',
  ]
  const rows = project.receipts.flatMap((receipt) =>
    receipt.lines.map((line) => {
      const m = metricsFor(line)
      return [
        receipt.supplier,
        receipt.invoiceNo,
        receipt.date,
        line.description,
        m.materialName,
        m.category,
        line.quantity,
        line.unit,
        line.unitCost,
        Math.round(line.massKg * 100) / 100,
        Math.round(m.carbonKg * 100) / 100,
        Math.round(m.salvageUsd * 100) / 100,
      ]
    }),
  )
  return [header, ...rows].map((cols) => cols.map(csvEscape).join(',')).join('\n')
}

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'project'
}

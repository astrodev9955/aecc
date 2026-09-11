import type { LineItem, Receipt } from '../types'
import { emptyLine, massFor, normalizeUnit } from '../lib/lines'
import { matchMaterial } from './materials'

function line(
  description: string,
  materialId: string,
  quantity: number,
  unit: LineItem['unit'],
  unitCost: number,
  massKg: number,
): LineItem {
  return {
    id: crypto.randomUUID(),
    description,
    materialId,
    quantity,
    unit,
    unitCost,
    massKg,
  }
}

export interface SampleReceipt extends Receipt {
  blurb: string
  rotate: number
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'sample-steel',
    supplier: 'Cascade Steel & Supply',
    invoiceNo: 'CS-44218',
    date: '2026-03-12',
    location: 'Jobsite — Riverside Annex',
    status: 'review',
    source: 'sample',
    blurb: 'Structural steel delivery. Wide flange and HSS.',
    rotate: -2.2,
    lines: [
      line('W12×35 A992 beams — 18 pcs @ 18 ft', 'steel-sections', 18, 'ea', 412, 1728),
      line('HSS 6×6×3/8 A500 columns — 12 pcs', 'steel-sections', 12, 'ea', 286, 864),
      line('#5 A615 rebar, 20 ft sticks — 2.4 t', 'rebar', 2.4, 't', 980, 2400),
    ],
  },
  {
    id: 'sample-copper',
    supplier: 'Pacific Copper Works',
    invoiceNo: 'PCW-10933',
    date: '2026-04-02',
    location: 'Jobsite — Riverside Annex',
    status: 'review',
    source: 'sample',
    blurb: 'Type L copper and building wire. Highest salvage on the job.',
    rotate: 1.6,
    lines: [
      line('Type L copper 3/4 in. — 420 lf', 'copper-pipe', 420, 'lf', 4.85, 235),
      line('Type L copper 1/2 in. — 280 lf', 'copper-pipe', 280, 'lf', 3.1, 112),
      line('THHN 12 AWG copper — 2,400 lf', 'copper-wire', 2400, 'lf', 0.42, 216),
    ],
  },
  {
    id: 'sample-concrete',
    supplier: 'Willamette Ready Mix',
    invoiceNo: 'WRM-7781',
    date: '2026-02-28',
    location: 'Jobsite — Riverside Annex',
    status: 'review',
    source: 'sample',
    blurb: 'Foundation pour. Carbon is in the cement, not the mass.',
    rotate: 0.8,
    lines: [
      line('4,000 psi ready-mix — 42 m³', 'concrete-c30', 42, 'm3', 168, 100800),
      line('4,000 psi ready-mix — 18 m³ (walls)', 'concrete-c30', 18, 'm3', 168, 43200),
    ],
  },
  {
    id: 'sample-timber',
    supplier: 'Oregon Timber Co.',
    invoiceNo: 'OTC-55102',
    date: '2026-03-21',
    location: 'Jobsite — Riverside Annex',
    status: 'review',
    source: 'sample',
    blurb: 'Douglas-fir framing package. Offcuts are the leak.',
    rotate: -1.4,
    lines: [
      line('DF-L 2×6 × 10 ft — 480 pcs', 'softwood', 480, 'ea', 8.4, 1920),
      line('DF-L 2×10 × 16 ft — 96 pcs', 'softwood', 96, 'ea', 22.5, 1152),
      line('CDX 4×8 × 1/2 in. sheathing — 220 sheets', 'plywood', 220, 'sheet', 28, 4840),
    ],
  },
]

export function cloneSample(sample: SampleReceipt): Receipt {
  return {
    id: crypto.randomUUID(),
    supplier: sample.supplier,
    invoiceNo: sample.invoiceNo,
    date: sample.date,
    location: sample.location,
    status: 'logged',
    source: 'sample',
    lines: sample.lines.map((item) => ({ ...item, id: crypto.randomUUID() })),
  }
}

export function receiptFromOcrText(raw: string): Receipt {
  const lines = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  const supplier = lines[0]?.replace(/^(supplier|from)[:\s]+/i, '') ?? 'Unknown supplier'
  const invoiceMatch = raw.match(/inv(?:oice)?[#:\s-]*([A-Z0-9-]{3,})/i)
  const isoDate = raw.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  const slashDate = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/)
  let date = new Date().toISOString().slice(0, 10)
  if (isoDate?.[1]) date = isoDate[1]
  else if (slashDate) {
    const month = slashDate[1]!.padStart(2, '0')
    const day = slashDate[2]!.padStart(2, '0')
    date = `${slashDate[3]}-${month}-${day}`
  }

  const parsedLines: LineItem[] = []

  for (const row of lines.slice(1)) {
    if (/^(invoice|date|total|subtotal|location|job)\b/i.test(row) && !/\d/.test(row.slice(8))) continue
    const qtyMatch = row.match(/(\d[\d,]*(?:\.\d+)?)\s*(lf|m2|m3|kg|ton|t|ea|sheet|pcs|pc|ft|m)?/i)
    if (!qtyMatch) continue
    const spec = matchMaterial(row)
    const quantity = Number((qtyMatch[1] ?? '0').replace(/,/g, ''))
    if (!Number.isFinite(quantity) || quantity <= 0) continue
    const unit = normalizeUnit(qtyMatch[2])
    const costMatch = row.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/)
    const unitCost = costMatch ? Number(costMatch[1]!.replace(/,/g, '')) : 0
    parsedLines.push({
      id: crypto.randomUUID(),
      description: row.replace(/\s+/g, ' ').slice(0, 96),
      materialId: spec.id,
      quantity,
      unit,
      unitCost: Number.isFinite(unitCost) ? unitCost : 0,
      massKg: massFor(spec.id, quantity, unit),
    })
  }

  if (parsedLines.length === 0) {
    parsedLines.push({
      ...emptyLine(),
      description: 'Unparsed line — confirm material and quantity',
    })
  }

  return {
    id: crypto.randomUUID(),
    supplier,
    invoiceNo: invoiceMatch?.[1] ?? `MAN-${Date.now().toString().slice(-6)}`,
    date,
    location: 'Jobsite upload',
    status: 'review',
    source: 'scan',
    lines: parsedLines,
  }
}

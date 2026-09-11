import type { MaterialSpec } from '../types'

/**
 * Indicative A1–A3 embodied carbon and salvage factors.
 * Carbon: ICE Database v3 / industry averages (kgCO2e per kg).
 * Salvage: approximate US secondary-market / scrap values, 2025.
 * Not a certified LCA — suitable for a construction-phase passport that
 * can later be refined with EPDs.
 */
export const MATERIALS: MaterialSpec[] = [
  {
    id: 'steel-sections',
    name: 'Structural steel (sections)',
    aliases: ['hss', 'w-beam', 'wide flange', 'a992', 'a500', 'steel beam', 'steel column', 'i-beam', 'tube steel'],
    category: 'Metals',
    carbonPerKg: 1.55,
    salvagePerKg: 0.28,
    recoverability: 'high',
    densityKgPerUnit: { kg: 1, t: 1000, ton: 907.185 },
    notes: 'High scrap demand. Bolted connections recover better than welded.',
  },
  {
    id: 'rebar',
    name: 'Reinforcing bar',
    aliases: ['rebar', 'reinforcing', 'a615', '#4 bar', '#5 bar', '#6 bar'],
    category: 'Metals',
    carbonPerKg: 1.99,
    salvagePerKg: 0.18,
    recoverability: 'medium',
    densityKgPerUnit: { kg: 1, t: 1000, ton: 907.185 },
    notes: 'Recoverable at demolition; salvage depends on contamination.',
  },
  {
    id: 'copper-pipe',
    name: 'Copper pipe (Type L)',
    aliases: ['copper', 'type l', 'type k', 'cu pipe', 'copper tube', 'plumbing copper'],
    category: 'MEP',
    carbonPerKg: 2.71,
    salvagePerKg: 8.4,
    recoverability: 'high',
    densityKgPerUnit: { kg: 1, m: 1.83, lf: 0.56 },
    notes: 'Among the highest salvage values on a jobsite. Theft risk is a tracking signal.',
  },
  {
    id: 'copper-wire',
    name: 'Copper building wire',
    aliases: ['thhn', 'copper wire', 'mc cable', 'electrical copper'],
    category: 'MEP',
    carbonPerKg: 2.71,
    salvagePerKg: 6.9,
    recoverability: 'high',
    densityKgPerUnit: { kg: 1, m: 0.29, lf: 0.09 },
    notes: 'Pull-out at end of life is routine. Document gauge and length.',
  },
  {
    id: 'aluminum',
    name: 'Aluminum extrusions',
    aliases: ['aluminum', 'aluminium', 'storefront', 'curtain wall', 'al extrusion'],
    category: 'Envelope',
    carbonPerKg: 8.24,
    salvagePerKg: 1.45,
    recoverability: 'high',
    densityKgPerUnit: { kg: 1, t: 1000 },
    notes: 'Primary aluminum is carbon-heavy; recycled content and take-back matter.',
  },
  {
    id: 'concrete-c30',
    name: 'Ready-mix concrete (C30 / 4,000 psi)',
    aliases: ['ready mix', 'ready-mix', 'concrete', '4000 psi', 'c30', 'c35'],
    category: 'Concrete',
    carbonPerKg: 0.132,
    salvagePerKg: 0.012,
    recoverability: 'low',
    densityKgPerUnit: { kg: 1, m3: 2400, t: 1000 },
    notes: 'Crushed to aggregate. Cement content drives most of the carbon.',
  },
  {
    id: 'cmu',
    name: 'Concrete masonry unit',
    aliases: ['cmu', 'block', 'cinder block', 'masonry'],
    category: 'Concrete',
    carbonPerKg: 0.148,
    salvagePerKg: 0.04,
    recoverability: 'medium',
    densityKgPerUnit: { ea: 18, kg: 1 },
    notes: 'Whole-unit reuse is possible if mortar type is documented.',
  },
  {
    id: 'softwood',
    name: 'Dimensional lumber (Douglas fir)',
    aliases: ['df-l', 'douglas fir', '2x4', '2x6', '2x8', '2x10', 'stud', 'framing lumber', 'spf'],
    category: 'Timber',
    carbonPerKg: 0.31,
    salvagePerKg: 0.22,
    recoverability: 'medium',
    densityKgPerUnit: { kg: 1, m3: 530, lf: 1.6, m: 5.25 },
    notes: 'Biogenic carbon not credited here. Reuse beats downcycling to chips.',
  },
  {
    id: 'clt',
    name: 'Cross-laminated timber',
    aliases: ['clt', 'mass timber', 'panel'],
    category: 'Timber',
    carbonPerKg: 0.44,
    salvagePerKg: 0.35,
    recoverability: 'high',
    densityKgPerUnit: { kg: 1, m3: 480, m2: 72 },
    notes: 'Panelized — designed for disassembly if connectors are recorded.',
  },
  {
    id: 'plywood',
    name: 'Structural plywood / OSB',
    aliases: ['plywood', 'osb', 'sheathing', 'cdx'],
    category: 'Timber',
    carbonPerKg: 0.45,
    salvagePerKg: 0.08,
    recoverability: 'low',
    densityKgPerUnit: { sheet: 22, kg: 1 },
    notes: 'Adhesives limit clean reuse. Track mill and grade.',
  },
  {
    id: 'gypsum',
    name: 'Gypsum board',
    aliases: ['drywall', 'gypsum', 'sheetrock', 'gwb', 'type x'],
    category: 'Finishes',
    carbonPerKg: 0.13,
    salvagePerKg: 0.01,
    recoverability: 'low',
    densityKgPerUnit: { sheet: 25, kg: 1 },
    notes: 'Recycling exists in some markets; contamination is the limiter.',
  },
  {
    id: 'mineral-wool',
    name: 'Mineral wool insulation',
    aliases: ['mineral wool', 'rockwool', 'batt', 'insulation'],
    category: 'Envelope',
    carbonPerKg: 1.28,
    salvagePerKg: 0.05,
    recoverability: 'medium',
    densityKgPerUnit: { kg: 1, m2: 4.2 },
    notes: 'Unfaced batts can be recovered if kept dry.',
  },
  {
    id: 'float-glass',
    name: 'Float / insulated glass',
    aliases: ['glass', 'igu', 'glazing', 'window'],
    category: 'Envelope',
    carbonPerKg: 1.44,
    salvagePerKg: 0.06,
    recoverability: 'medium',
    densityKgPerUnit: { kg: 1, m2: 20 },
    notes: 'IGUs are hard to separate. Record make, spacer, and gas fill.',
  },
  {
    id: 'brick',
    name: 'Clay brick',
    aliases: ['brick', 'clay brick', 'facing brick'],
    category: 'Envelope',
    carbonPerKg: 0.24,
    salvagePerKg: 0.18,
    recoverability: 'high',
    densityKgPerUnit: { ea: 2.3, kg: 1 },
    notes: 'Lime mortar makes whole-brick reuse practical. Cement mortar does not.',
  },
  {
    id: 'pvc-pipe',
    name: 'PVC / DWV pipe',
    aliases: ['pvc', 'dwv', 'schedule 40', 'plastic pipe'],
    category: 'MEP',
    carbonPerKg: 2.41,
    salvagePerKg: 0.12,
    recoverability: 'medium',
    densityKgPerUnit: { kg: 1, m: 1.1, lf: 0.34 },
    notes: 'Resin ID and diameter determine recyclability.',
  },
  {
    id: 'galvanized-duct',
    name: 'Galvanized sheet duct',
    aliases: ['duct', 'hvac duct', 'galvanized', 'sheet metal'],
    category: 'MEP',
    carbonPerKg: 2.82,
    salvagePerKg: 0.24,
    recoverability: 'high',
    densityKgPerUnit: { kg: 1 },
    notes: 'Clean galvanized scrap is routinely recovered.',
  },
]

function fallbackMaterial(): MaterialSpec {
  const first = MATERIALS[0]
  if (!first) throw new Error('Material library is empty')
  return first
}

export const MATERIAL_BY_ID: Record<string, MaterialSpec> = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m]),
)

export function getMaterial(id: string): MaterialSpec {
  return MATERIAL_BY_ID[id] ?? fallbackMaterial()
}

export function matchMaterial(text: string): MaterialSpec {
  const hay = text.toLowerCase()
  let best = fallbackMaterial()
  let score = 0
  for (const spec of MATERIALS) {
    let s = 0
    if (hay.includes(spec.name.toLowerCase())) s += 4
    for (const alias of spec.aliases) {
      if (hay.includes(alias)) s += alias.length > 3 ? 3 : 2
    }
    if (s > score) {
      score = s
      best = spec
    }
  }
  return best
}

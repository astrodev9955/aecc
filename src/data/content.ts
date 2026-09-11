export type HeroVisual = 'receipt' | 'carbon' | 'salvage' | 'passport'

export interface HeroPin {
  top: string
  left: string
  kicker: string
  value: string
}

export interface HeroSlide {
  id: string
  enabled: boolean
  kicker: string
  title: string
  emphasis: string
  lede: string
  metric: string
  metricLabel: string
  visual: HeroVisual
  image: string
  sheet: string
  sheetName: string
  scale: string
  pins: HeroPin[]
}

export interface PartnerItem {
  id: string
  enabled: boolean
  name: string
  src: string
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'proof',
    enabled: true,
    kicker: 'As-purchased record',
    title: 'Specify the copper.',
    emphasis: 'Prove it went into the building.',
    lede: 'Photograph the supplier ticket at delivery. Circular logs what actually arrived — mass, carbon, and salvage — before offcuts leave in a skip.',
    metric: '1 photo',
    metricLabel: 'Capture on the dock',
    visual: 'receipt',
    image: '/hero/frame.jpg',
    sheet: 'A-101',
    sheetName: 'Structural frame',
    scale: '1:100',
    pins: [
      { top: '22%', left: '8%', kicker: 'Type L copper', value: '420 lf' },
      { top: '58%', left: '54%', kicker: 'Invoice PCW-10933', value: 'Logged' },
    ],
  },
  {
    id: 'carbon',
    enabled: true,
    kicker: 'Embodied carbon',
    title: 'A1–A3 from the invoice.',
    emphasis: 'Not a guess from a core sample.',
    lede: 'Line items match a material library with indicative ICE factors. The ledger accumulates kgCO₂e as the job is built, ready for an LCA handoff later.',
    metric: 'A1–A3',
    metricLabel: 'Purchase-based inventory',
    visual: 'carbon',
    image: '/hero/mass.jpg',
    sheet: 'A-301',
    sheetName: 'Building section',
    scale: '1:50',
    pins: [
      { top: '18%', left: '56%', kicker: 'Concrete', value: '42 tCO₂e' },
      { top: '62%', left: '10%', kicker: 'Metals', value: '31 tCO₂e' },
    ],
  },
  {
    id: 'salvage',
    enabled: true,
    kicker: 'Secondary market',
    title: 'Copper comes back.',
    emphasis: 'Concrete mostly does not.',
    lede: 'Salvage value sits next to carbon. Metals show up as a real option on the asset file — the number a buyer or lender can underwrite at end of life.',
    metric: '$8.40/kg',
    metricLabel: 'Type L copper scrap',
    visual: 'salvage',
    image: '/hero/copper.jpg',
    sheet: 'M-201',
    sheetName: 'MEP riser',
    scale: 'NTS',
    pins: [
      { top: '20%', left: '48%', kicker: 'Recoverable copper', value: '$12,480' },
      { top: '68%', left: '12%', kicker: 'Scrap factor', value: '0.92' },
    ],
  },
  {
    id: 'passport',
    enabled: true,
    kicker: 'Disposition',
    title: 'Hand them a birth certificate.',
    emphasis: 'Not a forensic survey invoice.',
    lede: 'Ten years on, the owner prints a material passport: inventory, embodied carbon, recoverable value. The building has a file. The walls stay closed.',
    metric: '10 yr',
    metricLabel: 'The window before sale',
    visual: 'passport',
    image: '/hero/facade.jpg',
    sheet: 'G-001',
    sheetName: 'Material passport',
    scale: 'AS-BUILT',
    pins: [
      { top: '24%', left: '6%', kicker: 'Passport ID', value: 'CIR-A8F2-2026' },
      { top: '64%', left: '52%', kicker: 'Recoverable', value: '38%' },
    ],
  },
]

export const PARTNERS: PartnerItem[] = [
  { id: 'harbor', enabled: true, name: 'Harbor + Field', src: '/partners/harbor.svg' },
  { id: 'cascade', enabled: true, name: 'Cascade Steel', src: '/partners/cascade.svg' },
  { id: 'pacific', enabled: true, name: 'Pacific Copper', src: '/partners/pacific.svg' },
  { id: 'willamette', enabled: true, name: 'Willamette Mix', src: '/partners/willamette.svg' },
  { id: 'oregon', enabled: true, name: 'Oregon Timber', src: '/partners/oregon.svg' },
  { id: 'kline', enabled: true, name: 'Kline Structural', src: '/partners/kline.svg' },
  { id: 'northline', enabled: true, name: 'Northline', src: '/partners/northline.svg' },
  { id: 'ridge', enabled: true, name: 'River & Ridge', src: '/partners/ridge.svg' },
]

export const PARTNER_COPY = {
  eyebrow: 'On the job with',
  title: 'Partners across the dock, the trailer, and the office.',
}

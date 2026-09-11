import type { Project } from '../types'

const STALE_DAYS = 14

function receiptTime(project: Project): number | null {
  let latest = 0
  for (const receipt of project.receipts) {
    const raw = receipt.postedAt || receipt.date
    if (!raw) continue
    const time = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw).getTime()
    if (Number.isFinite(time) && time > latest) latest = time
  }
  if (project.createdAt) {
    const created = new Date(project.createdAt).getTime()
    if (Number.isFinite(created) && (latest === 0 || created > latest) && project.receipts.length === 0) {
      latest = created
    }
  }
  return latest || null
}

export function lastActivityIso(project: Project): string | null {
  const time = receiptTime(project)
  return time ? new Date(time).toISOString() : project.createdAt ?? null
}

export function daysSinceActivity(project: Project): number | null {
  const time = receiptTime(project)
  if (!time) return project.receipts.length === 0 ? Infinity : null
  return Math.floor((Date.now() - time) / 86_400_000)
}

export function passportRevision(project: Project): number {
  return project.receipts.length
}

export function jobGaps(project: Project): string[] {
  const gaps: string[] = []
  if (!project.address.trim()) gaps.push('No address')
  if (!project.typology.trim()) gaps.push('No typology')
  if (!project.areaSqft) gaps.push('No area')
  if (project.receipts.length === 0) gaps.push('No deliveries yet')
  const days = daysSinceActivity(project)
  if (project.receipts.length > 0 && days != null && days >= STALE_DAYS) {
    gaps.push(`Quiet for ${days} days`)
  }
  return gaps
}

export interface JobPulse {
  project: Project
  revision: number
  gaps: string[]
  daysQuiet: number | null
  stale: boolean
  lastIso: string | null
}

export function jobPulse(project: Project): JobPulse {
  const daysQuiet = daysSinceActivity(project)
  const gaps = jobGaps(project)
  return {
    project,
    revision: passportRevision(project),
    gaps,
    daysQuiet: daysQuiet === Infinity ? null : daysQuiet,
    stale: Boolean(daysQuiet != null && daysQuiet >= STALE_DAYS && project.receipts.length > 0),
    lastIso: lastActivityIso(project),
  }
}

export function attentionJobs(projects: Project[]): JobPulse[] {
  return projects
    .map(jobPulse)
    .filter((item) => item.gaps.length > 0)
    .sort((a, b) => {
      const aEmpty = a.project.receipts.length === 0 ? 0 : 1
      const bEmpty = b.project.receipts.length === 0 ? 0 : 1
      if (aEmpty !== bEmpty) return aEmpty - bEmpty
      return (b.daysQuiet ?? 0) - (a.daysQuiet ?? 0)
    })
}

export function knownSuppliers(projects: Project[]): { name: string; count: number }[] {
  const map = new Map<string, number>()
  for (const project of projects) {
    for (const receipt of project.receipts) {
      const name = receipt.supplier.trim()
      if (!name) continue
      map.set(name, (map.get(name) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

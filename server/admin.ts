import bcrypt from 'bcryptjs'
import type { NextFunction, Request, Response } from 'express'
import { ObjectId, collections, type UserDoc } from './db.ts'

export function emailsFromEnv(): string[] {
  return (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes('@'))
}

export function isAdminRole(value: string | undefined): boolean {
  return value === 'admin'
}

export async function ensureAdminAccount(): Promise<void> {
  const emails = emailsFromEnv()
  if (emails.length === 0) return

  const password = process.env.ADMIN_PASSWORD ?? ''
  const now = new Date()

  for (const email of emails) {
    const existing = await collections().users.findOne({ email })
    if (existing) {
      if (!isAdminRole(existing.role)) {
        await collections().users.updateOne({ _id: existing._id }, { $set: { role: 'admin' } })
        console.log(`Promoted ${email} to admin`)
      }
      continue
    }

    if (password.length < 8) {
      console.log(`No account for ADMIN_EMAIL ${email}. Set ADMIN_PASSWORD (8+ characters) to create one.`)
      continue
    }

    await collections().users.insertOne({
      name: 'Circular Admin',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      phone: '+12025550100',
      phoneCountry: 'US',
      phoneNational: '2025550100',
      planId: 'firm',
      planStatus: 'active',
      planStartedAt: now,
      role: 'admin',
      createdAt: now,
    })
    console.log(`Created admin account ${email}`)
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    if (!req.userId) {
      res.status(401).json({ error: 'Sign in required' })
      return
    }
    const user = await collections().users.findOne({ _id: new ObjectId(req.userId) })
    if (!user || !isAdminRole(user.role)) {
      res.status(403).json({ error: 'Admin access required' })
      return
    }
    next()
  })().catch(next)
}

export async function usageByUserIds(ids: ObjectId[]): Promise<Map<string, { projects: number; receipts: number }>> {
  const usage = new Map<string, { projects: number; receipts: number }>()
  for (const id of ids) usage.set(id.toHexString(), { projects: 0, receipts: 0 })
  if (ids.length === 0) return usage

  const [projects, receipts] = await Promise.all([
    collections()
      .projects.aggregate<{ _id: ObjectId; count: number }>([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }])
      .toArray(),
    collections()
      .receipts.aggregate<{ _id: ObjectId; count: number }>([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }])
      .toArray(),
  ])

  for (const row of projects) {
    const current = usage.get(row._id.toHexString())
    if (current) current.projects = row.count
  }
  for (const row of receipts) {
    const current = usage.get(row._id.toHexString())
    if (current) current.receipts = row.count
  }
  return usage
}

export async function adminCount(): Promise<number> {
  return collections().users.countDocuments({ role: 'admin' })
}

export function roleOf(user: UserDoc): 'admin' | 'user' {
  return isAdminRole(user.role) ? 'admin' : 'user'
}

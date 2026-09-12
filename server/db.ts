import { MongoClient, ObjectId, type Collection, type Db } from 'mongodb'

export { ObjectId }

export interface LineDoc {
  id: string
  description: string
  materialId: string
  quantity: number
  unit: string
  unitCost: number
  massKg: number
  sortOrder: number
}

export interface UserDoc {
  _id: ObjectId
  name: string
  email: string
  passwordHash: string
  phone?: string
  phoneCountry?: string
  phoneNational?: string
  planId: string
  planStatus: string
  planStartedAt: Date
  planRenewsAt?: Date
  planCancelAt?: Date
  pendingPlanId?: string
  trialEndsAt?: Date
  stripeCustomerId?: string
  role?: 'admin' | 'user'
  payment?: {
    methodId: string
    methodName: string
    label: string
    last4?: string
    brand?: string
    email?: string
    updatedAt: Date
  }
  createdAt: Date
}

export interface BillingInvoiceDoc {
  _id: ObjectId
  userId: ObjectId
  number: string
  planId: string
  planName: string
  amount: number
  currency: string
  status: 'open' | 'paid' | 'void'
  methodId: string
  methodName: string
  label: string
  reference: string
  periodStart: Date
  periodEnd: Date
  stripeSessionId?: string
  stripeSubscriptionId?: string
  payerEmail?: string
  notes?: string
  createdAt: Date
  paidAt?: Date
}

export interface ProjectDoc {
  _id: ObjectId
  userId: ObjectId
  name: string
  address: string
  typology: string
  areaSqft: number
  owner: string
  year: number
  notes: string
  shareToken?: string
  createdAt: Date
  updatedAt: Date
}

export interface ReceiptDoc {
  _id: ObjectId
  userId: ObjectId
  projectId: ObjectId
  supplier: string
  invoiceNo: string
  date: string
  location: string
  status: string
  source: string
  postedAt: Date | null
  createdAt: Date
  updatedAt: Date
  lines: LineDoc[]
}

export type HydratedProject = ProjectDoc & { receipts: ReceiptDoc[] }

export interface SettingsDoc {
  _id: string
  updatedAt?: Date
  [key: string]: unknown
}

interface Collections {
  users: Collection<UserDoc>
  projects: Collection<ProjectDoc>
  receipts: Collection<ReceiptDoc>
  invoices: Collection<BillingInvoiceDoc>
  settings: Collection<SettingsDoc>
}

function databaseUrl(): string {
  let raw = (process.env.DATABASE_URL || process.env.MONGODB_URI || '').trim()
  if (!raw) {
    throw new Error(
      'DATABASE_URL is not set. In Railway → Variables, add DATABASE_URL (the mongodb+srv:// line from Atlas). Then redeploy.',
    )
  }
  if (!/mongodb(\+srv)?:\/\/[^/?]+\/[^?]/.test(raw)) {
    raw = raw.includes('?') ? raw.replace('?', '/circular?') : `${raw.replace(/\/$/, '')}/circular`
  }
  return raw
}

const client = new MongoClient(databaseUrl())
let db: Db | null = null

export async function connectDb(): Promise<Db> {
  if (db) return db
  await client.connect()
  db = client.db()
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ role: 1 }),
    db.collection('projects').createIndex({ userId: 1 }),
    db.collection('projects').createIndex({ shareToken: 1 }, { unique: true, sparse: true }),
    db.collection('receipts').createIndex({ projectId: 1 }),
    db.collection('receipts').createIndex({ userId: 1 }),
    db.collection('invoices').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('invoices').createIndex({ status: 1, createdAt: -1 }),
    db.collection('invoices').createIndex({ number: 1 }, { unique: true }),
    db.collection('invoices').createIndex({ stripeSessionId: 1 }, { sparse: true }),
  ])
  return db
}

export function collections(): Collections {
  if (!db) throw new Error('Database not connected')
  return {
    users: db.collection<UserDoc>('users'),
    projects: db.collection<ProjectDoc>('projects'),
    receipts: db.collection<ReceiptDoc>('receipts'),
    invoices: db.collection<BillingInvoiceDoc>('invoices'),
    settings: db.collection<SettingsDoc>('settings'),
  }
}

export async function pingDb(): Promise<void> {
  const database = await connectDb()
  await database.command({ ping: 1 })
}

export async function hydrateProjects(projects: ProjectDoc[]): Promise<HydratedProject[]> {
  if (projects.length === 0) return []
  const receipts = await collections().receipts.find({ projectId: { $in: projects.map((item) => item._id) } }).toArray()
  return projects.map((project) => ({
    ...project,
    receipts: receipts.filter((receipt) => receipt.projectId.equals(project._id)),
  }))
}

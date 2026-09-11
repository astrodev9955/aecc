import type { PlanId } from '../data/plans'
import type { PaymentDraft } from '../data/payments'
import type { PlatformSettings } from '../data/platform'
import type { Project, Receipt } from '../types'

export type { PlatformSettings }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 204) return undefined as T

  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`)
  }
  return data as T
}

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  phoneCountry: string
  planId: PlanId
  planName: string
  planStatus: string
  planStartedAt: string
  planRenewsAt?: string
  planCancelAt?: string
  pendingPlanId?: PlanId
  trialEndsAt?: string
  trialDaysLeft: number
  writable: boolean
  role: 'admin' | 'user'
  createdAt: string
  payment?: { methodId: string; methodName: string; label: string }
  canExport: boolean
  canShare: boolean
  canPortfolio: boolean
  usage: { projects: number; receipts: number }
  limits: { maxProjects: number | null; maxReceipts: number | null }
}

export interface BillingInvoice {
  id: string
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
  periodStart: string
  periodEnd: string
  payerEmail?: string
  notes?: string
  createdAt: string
  paidAt?: string
  payTo: {
    title: string
    lines: { label: string; value: string }[]
    note: string
  } | null
  userId?: string
  userName?: string
  userEmail?: string
}

export interface BillingAccount {
  user: AuthUser
  invoices: BillingInvoice[]
  open: BillingInvoice | null
  invoice?: BillingInvoice
  checkoutUrl?: string
  cardCheckout?: boolean
}

export function getMe() {
  return request<{ user: AuthUser | null }>('/api/auth/me')
}

export function registerAccount(input: {
  name: string
  email: string
  password: string
  planId?: PlanId
  phoneCountry: string
  phoneNational: string
}) {
  return request<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function loginAccount(input: { email: string; password: string }) {
  return request<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logoutAccount() {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export function subscribeToPlan(planId: PlanId, payment?: PaymentDraft) {
  return request<BillingAccount>('/api/billing/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planId, payment }),
  })
}

export function getBillingAccount() {
  return request<BillingAccount>('/api/billing/account')
}

export function confirmBillingSession(sessionId: string) {
  return request<BillingAccount>('/api/billing/confirm', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export function cancelSubscription() {
  return request<{ user: AuthUser }>('/api/billing/cancel', { method: 'POST' })
}

export function resumeSubscription() {
  return request<{ user: AuthUser }>('/api/billing/resume', { method: 'POST' })
}

export function shareProject(projectId: string, rotate = false) {
  return request<{ project: Project; url: string }>(`/api/projects/${projectId}/share`, {
    method: 'POST',
    body: JSON.stringify({ rotate }),
  })
}

export function revokeProjectShare(projectId: string) {
  return request<{ project: Project }>(`/api/projects/${projectId}/share`, { method: 'DELETE' })
}

export function getPublicPassport(token: string) {
  return request<{ project: Project }>(`/api/public/passports/${encodeURIComponent(token)}`)
}

export function exportProject(projectId: string, format: 'json' | 'csv') {
  return request<{ filename: string; mime: string; content: string }>(
    `/api/projects/${projectId}/export?format=${format}`,
  )
}

export function adminListInvoices(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<{ invoices: BillingInvoice[] }>(`/api/admin/invoices${query}`)
}

export function adminMarkInvoicePaid(id: string) {
  return request<{ invoice: BillingInvoice }>(`/api/admin/invoices/${id}/paid`, { method: 'POST' })
}

export function adminVoidInvoice(id: string) {
  return request<{ invoice: BillingInvoice }>(`/api/admin/invoices/${id}/void`, { method: 'POST' })
}

export function listProjects() {
  return request<{ projects: Project[] }>('/api/projects')
}

export function createProject(input: Omit<Project, 'id' | 'receipts' | 'createdAt'>) {
  return request<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateProject(id: string, patch: Partial<Omit<Project, 'id' | 'receipts'>>) {
  return request<{ project: Project }>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteProject(id: string) {
  return request<void>(`/api/projects/${id}`, { method: 'DELETE' })
}

export function parseReceipt(projectId: string, input: { text?: string; file?: File }) {
  if (input.file) {
    const body = new FormData()
    body.append('file', input.file)
    return request<{ receipt: Receipt }>(`/api/projects/${projectId}/parse-receipt`, {
      method: 'POST',
      body,
    })
  }
  return request<{ receipt: Receipt }>(`/api/projects/${projectId}/parse-receipt`, {
    method: 'POST',
    body: JSON.stringify({ text: input.text ?? '' }),
  })
}

export function createReceipt(projectId: string, receipt: Receipt) {
  return request<{ project: Project }>(`/api/projects/${projectId}/receipts`, {
    method: 'POST',
    body: JSON.stringify(receipt),
  })
}

export function updateReceipt(receiptId: string, receipt: Receipt) {
  return request<{ project: Project }>(`/api/receipts/${receiptId}`, {
    method: 'PATCH',
    body: JSON.stringify(receipt),
  })
}

export function deleteReceipt(receiptId: string) {
  return request<{ project: Project }>(`/api/receipts/${receiptId}`, { method: 'DELETE' })
}

export interface AdminStats {
  accounts: number
  admins: number
  projects: number
  receipts: number
  openInvoices?: number
  pendingCheckout: number
  byPlan: { free: number; studio: number; firm: number }
  mrr: number
}

export interface AdminReceiptRow {
  id: string
  supplier: string
  invoiceNo: string
  date: string
  status: string
  location?: string
  createdAt: string
  userId: string
  userName: string
  userEmail: string
  projectId: string
  projectName: string
}

export interface AdminProjectRow {
  id: string
  name: string
  address: string
  typology: string
  owner: string
  year: number
  receiptCount: number
  createdAt: string
  updatedAt: string
  userId: string
  userName: string
  userEmail: string
}

export function adminOverview() {
  return request<{ stats: AdminStats; recentUsers: AuthUser[]; recentReceipts: AdminReceiptRow[] }>(
    '/api/admin/overview',
  )
}

export function adminListUsers(input: { q?: string; plan?: string; role?: string } = {}) {
  const params = new URLSearchParams()
  if (input.q) params.set('q', input.q)
  if (input.plan && input.plan !== 'all') params.set('plan', input.plan)
  if (input.role && input.role !== 'all') params.set('role', input.role)
  const query = params.toString()
  return request<{ users: AuthUser[] }>(`/api/admin/users${query ? `?${query}` : ''}`)
}

export function adminGetUser(id: string) {
  return request<{ user: AuthUser; projects: AdminProjectRow[]; receipts: AdminReceiptRow[] }>(
    `/api/admin/users/${id}`,
  )
}

export function adminUpdateUser(id: string, patch: { planId?: PlanId; role?: 'admin' | 'user' }) {
  return request<{ user: AuthUser }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function adminDeleteUser(id: string) {
  return request<void>(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export function adminListProjects(q = '') {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return request<{ projects: AdminProjectRow[] }>(`/api/admin/projects${query}`)
}

export function adminListReceipts(q = '') {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return request<{ receipts: AdminReceiptRow[] }>(`/api/admin/receipts${query}`)
}

export function getPlatform() {
  return request<{ platform: PlatformSettings }>('/api/platform')
}

export function adminGetPlatform() {
  return request<{ platform: PlatformSettings }>('/api/admin/platform')
}

export function savePlatformSettings(next: PlatformSettings) {
  return request<{ platform: PlatformSettings }>('/api/admin/platform', {
    method: 'PUT',
    body: JSON.stringify({ platform: next }),
  })
}

export async function uploadPlatformImage(file: File) {
  const body = new FormData()
  body.append('file', file)
  return request<{ url: string }>('/api/admin/upload', { method: 'POST', body })
}

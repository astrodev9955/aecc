import { subscriptionIsOpen, trialDaysLeft } from '../src/data/plans.ts'
import { getPlan, isPlanId } from './plans.ts'
import type { HydratedProject, LineDoc, ReceiptDoc, UserDoc } from './db.ts'

export function serializeLine(line: LineDoc) {
  return {
    id: line.id,
    description: line.description,
    materialId: line.materialId,
    quantity: line.quantity,
    unit: line.unit,
    unitCost: line.unitCost,
    massKg: line.massKg,
  }
}

export function serializeReceipt(receipt: ReceiptDoc) {
  return {
    id: receipt._id.toHexString(),
    supplier: receipt.supplier,
    invoiceNo: receipt.invoiceNo,
    date: receipt.date,
    location: receipt.location,
    status: receipt.status,
    source: receipt.source,
    postedAt: receipt.postedAt ? receipt.postedAt.toISOString() : undefined,
    lines: [...receipt.lines]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(serializeLine),
  }
}

export function serializeProject(project: HydratedProject) {
  return {
    id: project._id.toHexString(),
    name: project.name,
    address: project.address,
    typology: project.typology,
    areaSqft: project.areaSqft,
    owner: project.owner,
    year: project.year,
    notes: project.notes || undefined,
    shareToken: project.shareToken || undefined,
    createdAt: project.createdAt.toISOString(),
    receipts: [...project.receipts]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(serializeReceipt),
  }
}

export function serializeUser(user: UserDoc, usage: { projects: number; receipts: number }) {
  const plan = getPlan(user.planId)
  const open = subscriptionIsOpen(user.planStatus)
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    phoneCountry: user.phoneCountry || 'US',
    planId: plan.id,
    planName: plan.name,
    planStatus: user.planStatus,
    planStartedAt: user.planStartedAt.toISOString(),
    planRenewsAt: user.planRenewsAt ? user.planRenewsAt.toISOString() : undefined,
    planCancelAt: user.planCancelAt ? user.planCancelAt.toISOString() : undefined,
    pendingPlanId: user.pendingPlanId && isPlanId(user.pendingPlanId) ? user.pendingPlanId : undefined,
    trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : undefined,
    trialDaysLeft: user.planStatus === 'trialing' ? trialDaysLeft(user.trialEndsAt) : 0,
    writable: open,
    role: user.role === 'admin' ? 'admin' : 'user',
    createdAt: user.createdAt.toISOString(),
    payment: user.payment
      ? {
          methodId: user.payment.methodId,
          methodName: user.payment.methodName,
          label: user.payment.label,
        }
      : undefined,
    canExport: open && plan.canExport,
    canShare: open && plan.canShare,
    canPortfolio: open && plan.canPortfolio,
    usage,
    limits: {
      maxProjects: plan.maxProjects,
      maxReceipts: plan.maxReceipts,
    },
  }
}

import { getPlan, isLivePlanId, listPlans } from './platform.ts'
import { PLANS, type Plan } from '../src/data/plans.ts'

export { PLANS, getPlan, listPlans, type Plan }

export function isPlanId(value: string): value is Plan['id'] {
  return isLivePlanId(value)
}

export class PlanLimitError extends Error {
  status = 403
  constructor(message: string) {
    super(message)
  }
}

export function assertCanCreateProject(plan: Plan, projectCount: number): void {
  if (plan.maxProjects != null && projectCount >= plan.maxProjects) {
    throw new PlanLimitError(
      `${plan.name} includes ${plan.maxProjects} project${plan.maxProjects === 1 ? '' : 's'}. Upgrade to open another building file.`,
    )
  }
}

export function assertCanAddReceipt(plan: Plan, receiptCount: number): void {
  if (plan.maxReceipts != null && receiptCount >= plan.maxReceipts) {
    throw new PlanLimitError(
      `${plan.name} includes ${plan.maxReceipts} invoices. Upgrade to keep logging deliveries.`,
    )
  }
}

export function assertCanExport(plan: Plan): void {
  if (!plan.canExport) {
    throw new PlanLimitError('CSV and JSON export are on Studio and Firm. Upgrade to download the passport file.')
  }
}

export function assertCanShare(plan: Plan): void {
  if (!plan.canShare) {
    throw new PlanLimitError('Shareable passports are on Studio and Firm. Upgrade to send a buyer the link.')
  }
}

export function assertCanPortfolio(plan: Plan): void {
  if (!plan.canPortfolio) {
    throw new PlanLimitError('The office portfolio is on Firm. Upgrade to roll up every job.')
  }
}

export function assertAccountWritable(status: string): void {
  if (status === 'trialing' || status === 'active' || status === 'canceling') return
  throw new PlanLimitError('Your trial has ended. Subscribe to Studio or Firm to keep logging deliveries.')
}

import type { Project, Receipt } from '../types'

export function isDuplicateInvoice(project: Project, receipt: Receipt): boolean {
  const invoice = receipt.invoiceNo.trim().toLowerCase()
  const supplier = receipt.supplier.trim().toLowerCase()
  if (!invoice || !supplier) return false
  return project.receipts.some(
    (item) =>
      item.id !== receipt.id &&
      item.invoiceNo.trim().toLowerCase() === invoice &&
      item.supplier.trim().toLowerCase() === supplier,
  )
}

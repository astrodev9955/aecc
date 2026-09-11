export type PaymentMethodId =
  | 'card'
  | 'paypal'
  | 'payoneer'
  | 'alipay'
  | 'wechat'
  | 'bank'
  | 'wise'
  | 'apple'
  | 'google'

export type PaymentFieldKind = 'card' | 'email' | 'account' | 'bank' | 'wallet'

export interface PaymentMethod {
  id: PaymentMethodId
  name: string
  blurb: string
  kind: PaymentFieldKind
  enabled: boolean
  showMark: boolean
  integration: Record<string, string>
}

export interface IntegrationField {
  key: string
  label: string
  hint: string
  secret?: boolean
  required?: boolean
  placeholder?: string
  options?: string[]
}

export const PAYMENT_INTEGRATION_FIELDS: Record<PaymentMethodId, IntegrationField[]> = {
  card: [
    {
      key: 'processor',
      label: 'Processor',
      hint: 'Hosted card checkout is live for Stripe. Adyen, PayMongo, and Xendit keys can be stored for later; clients will be asked to pay by invoice until those are wired.',
      options: ['stripe', 'adyen', 'paymongo', 'xendit'],
      required: true,
    },
    { key: 'publishableKey', label: 'Publishable key', hint: 'Browser-safe key. Stripe: pk_live_… or pk_test_…', required: true, placeholder: 'pk_live_…' },
    { key: 'secretKey', label: 'Secret key', hint: 'Server-only key. Never shown on the public site.', secret: true, required: true, placeholder: 'sk_live_…' },
    { key: 'webhookSecret', label: 'Webhook secret', hint: 'Validates processor events (whsec_…).', secret: true, placeholder: 'whsec_…' },
    { key: 'merchantAccount', label: 'Merchant / account ID', hint: 'Optional connected account or merchant code.' },
  ],
  paypal: [
    { key: 'receiveEmail', label: 'Pay-to email', hint: 'Shown on the invoice so clients know where to send PayPal.', required: true, placeholder: 'billing@studio.com' },
    { key: 'mode', label: 'Mode', hint: 'Use sandbox until the live app is approved.', options: ['sandbox', 'live'] },
    { key: 'clientId', label: 'Client ID', hint: 'From the PayPal developer dashboard.' },
    { key: 'clientSecret', label: 'Client secret', hint: 'Server-only PayPal secret.', secret: true },
    { key: 'webhookId', label: 'Webhook ID', hint: 'Webhook subscription ID for payment events.' },
  ],
  payoneer: [
    { key: 'receiveEmail', label: 'Pay-to email', hint: 'Payoneer address clients should pay.', required: true, placeholder: 'studio@payoneer.com' },
    { key: 'programId', label: 'Program ID', hint: 'Payoneer partner / program identifier.' },
    { key: 'clientId', label: 'Client ID', hint: 'OAuth client ID from Payoneer.' },
    { key: 'clientSecret', label: 'Client secret', hint: 'OAuth client secret.', secret: true },
    { key: 'apiBase', label: 'API base URL', hint: 'Leave blank for the default Payoneer host.', placeholder: 'https://api.payoneer.com' },
  ],
  alipay: [
    { key: 'receiveAccount', label: 'Pay-to account', hint: 'Alipay account, email, or mobile shown on the invoice.', required: true },
    { key: 'appId', label: 'App ID', hint: 'Alipay open platform application ID.' },
    { key: 'pid', label: 'Partner ID (PID)', hint: 'Seller / partner identifier.' },
    { key: 'privateKey', label: 'Application private key', hint: 'RSA private key used to sign requests.', secret: true },
    { key: 'alipayPublicKey', label: 'Alipay public key', hint: 'Used to verify Alipay callbacks.', secret: true },
    { key: 'notifyUrl', label: 'Notify URL', hint: 'HTTPS endpoint for async payment notices.', placeholder: 'https://yoursite.com/api/billing/alipay/notify' },
  ],
  wechat: [
    { key: 'receiveAccount', label: 'Pay-to account', hint: 'WeChat ID or merchant shown on the invoice.', required: true },
    { key: 'appId', label: 'App ID', hint: 'WeChat / Weixin official app ID.' },
    { key: 'mchId', label: 'Merchant ID (mch_id)', hint: 'WeChat Pay merchant number.' },
    { key: 'apiKey', label: 'API key', hint: 'Legacy merchant API key.', secret: true },
    { key: 'apiV3Key', label: 'APIv3 key', hint: '32-character APIv3 key.', secret: true },
    { key: 'serialNo', label: 'Certificate serial no.', hint: 'Merchant API certificate serial.' },
  ],
  bank: [
    { key: 'beneficiary', label: 'Beneficiary name', hint: 'Legal name on the receiving account.', required: true },
    { key: 'bankName', label: 'Bank name', hint: 'Receiving bank as it should appear on invoices.', required: true },
    { key: 'accountNumber', label: 'Account number', hint: 'Domestic account number if not using IBAN.' },
    { key: 'routingNumber', label: 'Routing / sort code', hint: 'ACH routing, sort code, or BSB.' },
    { key: 'iban', label: 'IBAN', hint: 'International bank account number.' },
    { key: 'swift', label: 'SWIFT / BIC', hint: 'Required for most international wires.' },
    { key: 'instructions', label: 'Payer instructions', hint: 'Shown on the invoice. Mention the reference number.' },
  ],
  wise: [
    { key: 'receiveEmail', label: 'Pay-to email', hint: 'Wise address clients should pay.', required: true, placeholder: 'studio@wise.com' },
    { key: 'mode', label: 'Mode', hint: 'Sandbox until go-live.', options: ['sandbox', 'live'] },
    { key: 'apiToken', label: 'API token', hint: 'Wise personal or client credentials token.', secret: true },
    { key: 'profileId', label: 'Profile ID', hint: 'Business profile that receives payouts.' },
  ],
  apple: [
    { key: 'merchantId', label: 'Apple merchant ID', hint: 'merchant.com.… from Apple Developer.', required: true, placeholder: 'merchant.com.circular' },
    { key: 'merchantName', label: 'Display name', hint: 'Name shown on the Apple Pay sheet.', required: true },
    { key: 'countryCode', label: 'Country code', hint: 'Two-letter store country, e.g. US.', required: true, placeholder: 'US' },
    { key: 'certificate', label: 'Payment processing cert', hint: 'Reference or upload path for the Apple Pay cert.', secret: true },
  ],
  google: [
    { key: 'merchantId', label: 'Google merchant ID', hint: 'From Google Pay Business Console.', required: true },
    { key: 'merchantName', label: 'Display name', hint: 'Name shown on the Google Pay sheet.', required: true },
    { key: 'gateway', label: 'Gateway', hint: 'Processor token gateway.', options: ['stripe', 'adyen'], required: true },
    { key: 'gatewayMerchantId', label: 'Gateway merchant ID', hint: 'Usually the Stripe or Adyen account ID.', required: true },
  ],
}

export function integrationFields(id: PaymentMethodId): IntegrationField[] {
  return PAYMENT_INTEGRATION_FIELDS[id] ?? []
}

export function integrationValue(method: PaymentMethod, key: string): string {
  return method.integration?.[key] ?? ''
}

export function integrationReady(method: PaymentMethod): boolean {
  return integrationFields(method.id)
    .filter((field) => field.required)
    .every((field) => Boolean(integrationValue(method, field.key).trim()))
}

export function publicPayment(method: PaymentMethod): PaymentMethod {
  const fields = integrationFields(method.id)
  const integration: Record<string, string> = {}
  for (const field of fields) {
    if (field.secret) continue
    const value = integrationValue(method, field.key).trim()
    if (value) integration[field.key] = value
  }
  return { ...method, integration }
}

export interface PayLine {
  label: string
  value: string
}

export interface PayInstructions {
  title: string
  lines: PayLine[]
  note: string
}

export interface PaymentDraft {
  methodId: PaymentMethodId | 'saved'
  payerEmail?: string
  payerAccount?: string
}

export interface StoredPayment {
  methodId: PaymentMethodId
  methodName: string
  label: string
  last4?: string
  brand?: string
  email?: string
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit / debit card',
    blurb: 'Visa, Mastercard, Amex, Discover, UnionPay',
    kind: 'card',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'paypal',
    name: 'PayPal',
    blurb: 'Charge the PayPal balance or linked card',
    kind: 'email',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'payoneer',
    name: 'Payoneer',
    blurb: 'Pay from a Payoneer account or card',
    kind: 'email',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'alipay',
    name: 'Alipay',
    blurb: 'Alipay wallet, email, or mobile',
    kind: 'account',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'wechat',
    name: 'WeChat Pay',
    blurb: 'WeChat wallet on the linked mobile',
    kind: 'account',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'bank',
    name: 'Bank transfer',
    blurb: 'ACH, wire, SEPA, or local bank credit',
    kind: 'bank',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'wise',
    name: 'Wise',
    blurb: 'Pay from a Wise balance or account',
    kind: 'email',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'apple',
    name: 'Apple Pay',
    blurb: 'Confirm with Face ID, Touch ID, or passcode',
    kind: 'wallet',
    enabled: true,
    showMark: true,
    integration: {},
  },
  {
    id: 'google',
    name: 'Google Pay',
    blurb: 'Pay with the Google wallet on this device',
    kind: 'wallet',
    enabled: true,
    showMark: true,
    integration: {},
  },
]

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((item) => item.id === value)
}

export function getPaymentMethod(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((item) => item.id === id)
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function paymentError(draft: PaymentDraft): string | null {
  if (draft.methodId === 'saved') return null
  const method = getPaymentMethod(draft.methodId)
  if (!method) return 'Choose a payment method'
  if (method.kind === 'email') {
    const email = (draft.payerEmail ?? '').trim()
    if (email && !looksLikeEmail(email)) return `Enter a valid ${method.name} email`
  }
  return null
}

export function toStoredPayment(draft: PaymentDraft): StoredPayment {
  if (draft.methodId === 'saved') {
    throw new Error('Saved payment has no new details')
  }
  const method = getPaymentMethod(draft.methodId)
  if (!method) throw new Error('Choose a payment method')
  const email = (draft.payerEmail ?? '').trim().toLowerCase()
  const account = (draft.payerAccount ?? '').trim()
  if (email) {
    return { methodId: method.id, methodName: method.name, label: `${method.name} · ${email}`, email }
  }
  if (account) {
    return {
      methodId: method.id,
      methodName: method.name,
      label: `${method.name} · ${account}`,
      email: looksLikeEmail(account) ? account.toLowerCase() : undefined,
    }
  }
  return { methodId: method.id, methodName: method.name, label: method.name }
}

export function payInstructions(method: PaymentMethod, reference: string, amount?: number): PayInstructions {
  const i = method.integration ?? {}
  const money = amount && amount > 0 ? `$${amount} USD` : ''
  const lines: PayLine[] = []
  if (money) lines.push({ label: 'Amount', value: money })

  if (method.id === 'bank') {
    const rows: [string, string][] = [
      ['Beneficiary', i.beneficiary],
      ['Bank', i.bankName],
      ['Account', i.accountNumber],
      ['IBAN', i.iban],
      ['SWIFT / BIC', i.swift],
      ['Routing', i.routingNumber],
      ['Reference', reference],
    ]
    for (const [label, value] of rows) {
      if (value?.trim()) lines.push({ label, value: value.trim() })
    }
    if (!lines.some((line) => line.label === 'Reference')) lines.push({ label: 'Reference', value: reference })
    return {
      title: 'Send the transfer to this account',
      lines,
      note:
        i.instructions?.trim() ||
        `Use reference ${reference} so the studio can match your payment. The plan starts when the transfer is marked paid.`,
    }
  }

  const payTo = (i.receiveEmail || i.receiveAccount || '').trim()
  if (payTo) lines.push({ label: 'Send to', value: payTo })
  lines.push({ label: 'Reference', value: reference })
  return {
    title: `Pay with ${method.name}`,
    lines,
    note: payTo
      ? `Send ${money || 'the monthly amount'} to ${payTo} and include ${reference}.`
      : `Send ${money || 'the monthly amount'} from your ${method.name} account and include ${reference}. The studio matches the reference.`,
  }
}

import type { ReactNode } from 'react'
import { usePlatform } from '../context/Platform'
import { PAYMENT_METHODS, type PaymentMethodId } from '../data/payments'

function Frame({
  fill,
  stroke,
  label,
  children,
}: {
  fill: string
  stroke?: string
  label?: string
  children: ReactNode
}) {
  return (
    <svg viewBox="0 0 72 48" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <rect width="72" height="48" rx="8" fill={fill} stroke={stroke} />
      {children}
    </svg>
  )
}

function Word({ fill, size = 11, children }: { fill: string; size?: number; children: string }) {
  return (
    <text
      x="36"
      y="30"
      textAnchor="middle"
      fill={fill}
      fontFamily="Arial, sans-serif"
      fontSize={size}
      fontWeight="700"
    >
      {children}
    </text>
  )
}

function VisaMark() {
  return (
    <svg viewBox="0 0 72 48" role="img" aria-label="Visa">
      <rect width="72" height="48" rx="8" fill="#1a1f71" />
      <text
        x="36"
        y="31"
        textAnchor="middle"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="1"
      >
        VISA
      </text>
    </svg>
  )
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 72 48" role="img" aria-label="Mastercard">
      <rect width="72" height="48" rx="8" fill="#1c1915" />
      <circle cx="30" cy="24" r="12" fill="#eb001b" />
      <circle cx="42" cy="24" r="12" fill="#f79e1b" />
      <path d="M36 15.2a12 12 0 0 1 0 17.6 12 12 0 0 1 0-17.6z" fill="#ff5f00" />
    </svg>
  )
}

function AmexMark() {
  return (
    <Frame fill="#2e77bc" label="American Express">
      <Word fill="#fff">AMEX</Word>
    </Frame>
  )
}

function DiscoverMark() {
  return (
    <Frame fill="#ff6000" label="Discover">
      <Word fill="#fff" size={10}>
        DISCOVER
      </Word>
    </Frame>
  )
}

function UnionPayMark() {
  return (
    <svg viewBox="0 0 72 48" role="img" aria-label="UnionPay">
      <rect width="72" height="48" rx="8" fill="#fff" stroke="#ddd3c0" />
      <rect x="14" y="10" width="14" height="28" rx="2" fill="#e21836" />
      <rect x="29" y="10" width="14" height="28" rx="2" fill="#00447c" />
      <rect x="44" y="10" width="14" height="28" rx="2" fill="#007b84" />
    </svg>
  )
}

function CardMark() {
  return (
    <svg viewBox="0 0 72 48" aria-hidden="true">
      <rect width="72" height="48" rx="8" fill="#14110e" />
      <rect x="0" y="14" width="72" height="8" fill="#c45c26" />
      <rect x="10" y="32" width="22" height="6" rx="1" fill="#f6efe4" />
    </svg>
  )
}

function PaypalMark() {
  return (
    <Frame fill="#003087" label="PayPal">
      <Word fill="#fff" size={12}>
        PayPal
      </Word>
    </Frame>
  )
}

function PayoneerMark() {
  return (
    <Frame fill="#ff4800" label="Payoneer">
      <Word fill="#fff" size={9}>
        Payoneer
      </Word>
    </Frame>
  )
}

function AlipayMark() {
  return (
    <Frame fill="#1677ff" label="Alipay">
      <Word fill="#fff" size={11}>
        Alipay
      </Word>
    </Frame>
  )
}

function WechatMark() {
  return (
    <Frame fill="#07c160" label="WeChat Pay">
      <Word fill="#fff" size={9}>
        WeChat
      </Word>
    </Frame>
  )
}

function BankMark() {
  return (
    <svg viewBox="0 0 72 48" role="img" aria-label="Bank transfer">
      <rect width="72" height="48" rx="8" fill="#faf6ee" stroke="#ddd3c0" />
      <path d="M36 11 14 22h44L36 11z" fill="#14110e" />
      <rect x="18" y="24" width="6" height="10" fill="#5e574c" />
      <rect x="28" y="24" width="6" height="10" fill="#5e574c" />
      <rect x="38" y="24" width="6" height="10" fill="#5e574c" />
      <rect x="48" y="24" width="6" height="10" fill="#5e574c" />
      <rect x="14" y="35" width="44" height="3" fill="#14110e" />
    </svg>
  )
}

function WiseMark() {
  return (
    <Frame fill="#163300" label="Wise">
      <Word fill="#9fe870" size={13}>
        Wise
      </Word>
    </Frame>
  )
}

function ApplePayMark() {
  return (
    <Frame fill="#111" label="Apple Pay">
      <Word fill="#fff" size={10}>
        Apple Pay
      </Word>
    </Frame>
  )
}

function GooglePayMark() {
  return (
    <Frame fill="#f5f5f5" stroke="#ddd3c0" label="Google Pay">
      <Word fill="#202124" size={11}>
        G Pay
      </Word>
    </Frame>
  )
}

const FOOTER_MARKS = [
  { id: 'visa', node: <VisaMark /> },
  { id: 'mastercard', node: <MastercardMark /> },
  { id: 'amex', node: <AmexMark /> },
  { id: 'discover', node: <DiscoverMark /> },
  { id: 'unionpay', node: <UnionPayMark /> },
  { id: 'paypal', node: <PaypalMark /> },
  { id: 'payoneer', node: <PayoneerMark /> },
  { id: 'alipay', node: <AlipayMark /> },
  { id: 'wechat', node: <WechatMark /> },
  { id: 'bank', node: <BankMark /> },
  { id: 'wise', node: <WiseMark /> },
  { id: 'apple', node: <ApplePayMark /> },
  { id: 'google', node: <GooglePayMark /> },
]

export function MethodGlyph({ methodId }: { methodId: PaymentMethodId | 'saved' }) {
  switch (methodId) {
    case 'card':
    case 'saved':
      return <CardMark />
    case 'paypal':
      return <PaypalMark />
    case 'payoneer':
      return <PayoneerMark />
    case 'alipay':
      return <AlipayMark />
    case 'wechat':
      return <WechatMark />
    case 'bank':
      return <BankMark />
    case 'wise':
      return <WiseMark />
    case 'apple':
      return <ApplePayMark />
    case 'google':
      return <GooglePayMark />
    default:
      return <CardMark />
  }
}

const CARD_MARKS = new Set(['visa', 'mastercard', 'amex', 'discover', 'unionpay'])

export function PaymentMarks() {
  const payments = usePaymentVisibility()
  const marks = FOOTER_MARKS.filter((mark) => {
    if (CARD_MARKS.has(mark.id)) {
      const card = payments.find((item) => item.id === 'card')
      return Boolean(card?.enabled && card.showMark)
    }
    const method = payments.find((item) => item.id === mark.id)
    return Boolean(method?.enabled && method.showMark)
  })
  if (marks.length === 0) return null
  return (
    <div className="pay-row" aria-label="Accepted payment methods">
      <div className="pay-marks">
        {marks.map((method) => (
          <span key={method.id} className="pay-mark">
            {method.node}
          </span>
        ))}
      </div>
    </div>
  )
}

function usePaymentVisibility() {
  try {
    const { settings } = usePlatform()
    return settings.payments
  } catch {
    return PAYMENT_METHODS
  }
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { PlanId } from '../data/plans'
import type { PaymentDraft } from '../data/payments'
import {
  cancelSubscription,
  confirmBillingSession,
  getMe,
  loginAccount,
  logoutAccount,
  registerAccount,
  resumeSubscription,
  subscribeToPlan,
  type AuthUser,
  type BillingAccount,
} from '../lib/api'

interface AuthValue {
  user: AuthUser | null
  ready: boolean
  refresh: () => Promise<void>
  login: (input: { email: string; password: string }) => Promise<AuthUser>
  register: (input: {
    name: string
    email: string
    password: string
    planId?: PlanId
    phoneCountry: string
    phoneNational: string
  }) => Promise<AuthUser>
  subscribe: (planId: PlanId, payment?: PaymentDraft) => Promise<BillingAccount>
  confirmCheckout: (sessionId: string) => Promise<void>
  cancelPlan: () => Promise<void>
  resumePlan: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  async function refresh() {
    try {
      const data = await getMe()
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    refresh().finally(() => setReady(true))
  }, [])

  const value: AuthValue = {
    user,
    ready,
    refresh,
    login: async (input) => {
      const data = await loginAccount(input)
      setUser(data.user)
      return data.user
    },
    register: async (input) => {
      const data = await registerAccount(input)
      setUser(data.user)
      return data.user
    },
    subscribe: async (planId, payment) => {
      const data = await subscribeToPlan(planId, payment)
      setUser(data.user)
      return data
    },
    confirmCheckout: async (sessionId) => {
      const data = await confirmBillingSession(sessionId)
      setUser(data.user)
    },
    cancelPlan: async () => {
      const data = await cancelSubscription()
      setUser(data.user)
    },
    resumePlan: async () => {
      const data = await resumeSubscription()
      setUser(data.user)
    },
    logout: async () => {
      await logoutAccount()
      setUser(null)
    },
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

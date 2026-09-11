import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { defaultPlatform, type PlatformSettings } from '../data/platform'
import { getPlatform } from '../lib/api'

interface PlatformValue {
  settings: PlatformSettings
  ready: boolean
  refresh: () => Promise<void>
}

const PlatformContext = createContext<PlatformValue | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(defaultPlatform)
  const [ready, setReady] = useState(false)

  async function refresh() {
    try {
      const data = await getPlatform()
      setSettings(data.platform)
    } catch {
      setSettings(defaultPlatform())
    }
  }

  useEffect(() => {
    refresh().finally(() => setReady(true))
  }, [])

  return <PlatformContext value={{ settings, ready, refresh }}>{children}</PlatformContext>
}

export function usePlatform(): PlatformValue {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider')
  return ctx
}

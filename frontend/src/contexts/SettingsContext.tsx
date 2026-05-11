import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSettings, updateSettings as apiUpdate, type UserSettings } from '../api/settings'

interface Ctx {
  settings: UserSettings | null
  loading: boolean
  refresh: () => Promise<void>
  update: (patch: Partial<UserSettings>) => Promise<void>
}

const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try { setSettings(await getSettings()) }
    catch { setSettings(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const update = async (patch: Partial<UserSettings>) => {
    const updated = await apiUpdate(patch)
    setSettings(updated)
  }

  return <SettingsContext.Provider value={{ settings, loading, refresh, update }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}

export function fmtMoney(pct: number, accountSize: number, currency = 'USD') {
  const v = (pct / 100) * accountSize
  const sign = v >= 0 ? '+' : '-'
  const abs = Math.abs(v)
  const formatted = abs >= 1000 ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 }) : abs.toFixed(2)
  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  return `${sign}${sym}${formatted}`
}

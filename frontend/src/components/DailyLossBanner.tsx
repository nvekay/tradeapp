import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Trade } from '../types'
import { fmtMoney, useSettings } from '../contexts/SettingsContext'

function localDay(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function getTodayPnlPct(trades: Trade[]) {
  const today = localDay(new Date())
  return trades.reduce((sum, t) => {
    const d = new Date(t.date + 'Z')
    return localDay(d) === today ? sum + t.pnl_pct : sum
  }, 0)
}

export default function DailyLossBanner({ trades }: { trades: Trade[] }) {
  const { settings } = useSettings()
  const todayPnl = useMemo(() => getTodayPnlPct(trades), [trades])
  const count = useMemo(() => {
    const today = localDay(new Date())
    return trades.filter(t => localDay(new Date(t.date + 'Z')) === today).length
  }, [trades])

  if (!settings?.daily_loss_limit || count === 0 || todayPnl > settings.daily_loss_limit) return null

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
        <div>
          <div className="text-sm font-bold">Daily loss limit reached</div>
          <div className="mt-0.5 text-xs font-medium">
            Today: <span className="font-mono">{todayPnl.toFixed(2)}%</span>
            {settings && <> ({fmtMoney(todayPnl, settings.account_size, settings.currency)})</>}
            {' '}across {count} {count === 1 ? 'trade' : 'trades'}. Limit: <span className="font-mono">{settings.daily_loss_limit.toFixed(2)}%</span>.
          </div>
        </div>
      </div>
      <span className="rounded-lg bg-white/70 px-3 py-1.5 text-xs font-bold">No more trades today</span>
    </div>
  )
}

import { useMemo } from 'react'
import type { Trade } from '../types'

interface Props { trades: Trade[] }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function cellClass(winrate: number | null) {
  if (winrate == null) return 'bg-gray-50 text-[#CBD5E1] border-[#F1F5F9]'
  if (winrate >= 65) return 'bg-green-600 text-white border-green-600'
  if (winrate >= 50) return 'bg-green-100 text-green-800 border-green-200'
  if (winrate >= 35) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export default function PerformanceHeatmap({ trades }: Props) {
  const matrix = useMemo(() => {
    const data = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ wins: 0, total: 0 })))
    for (const t of trades) {
      if (t.result === 'open') continue
      const d = new Date(t.date + 'Z')
      const day = (d.getDay() + 6) % 7
      const hour = d.getHours()
      data[day][hour].total += 1
      if (t.pnl_pct > 0) data[day][hour].wins += 1
    }
    return data
  }, [trades])

  return (
    <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A]">Performance Heatmap</h3>
          <p className="text-xs text-[#64748B]">Winrate by day of week and hour of day.</p>
        </div>
        <div className="flex gap-2 text-[10px] font-semibold text-[#64748B]">
          <span className="rounded bg-green-100 px-2 py-1 text-green-800">Good</span>
          <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">Mixed</span>
          <span className="rounded bg-red-100 px-2 py-1 text-red-800">Weak</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[44px_repeat(24,minmax(28px,1fr))] gap-1">
            <div />
            {HOURS.map(h => <div key={h} className="text-center text-[10px] font-bold text-[#94A3B8]">{h}</div>)}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="contents">
                <div className="flex items-center text-xs font-bold text-[#64748B]">{day}</div>
                {HOURS.map(hour => {
                  const c = matrix[dayIdx][hour]
                  const wr = c.total ? Math.round(c.wins / c.total * 100) : null
                  return (
                    <div key={`${day}-${hour}`}
                      title={`${day} ${hour}:00 - ${c.total ? `${wr}% WR, ${c.total} trades` : 'no trades'}`}
                      className={`flex h-7 items-center justify-center rounded-md border text-[10px] font-bold ${cellClass(wr)}`}>
                      {c.total ? wr : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

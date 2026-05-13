import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Save } from 'lucide-react'
import { getJournalDates } from '../api/journal'
import { getTrades } from '../api/trades'
import { getWeeklyPlan, saveWeeklyPlan } from '../api/weeklyPlans'
import type { Trade } from '../types'

const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const weekStartOf = (raw: Date | string) => {
  const d = typeof raw === 'string' ? new Date(raw) : new Date(raw)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return dateKey(d)
}

function PnlCalendar({ trades, journalDates, selectedWeek, onDayClick, onWeekSelect }: {
  trades: Trade[]
  journalDates: Set<string>
  selectedWeek: string
  onDayClick: (date: string) => void
  onWeekSelect: (weekStart: string) => void
}) {
  const [currentDate, setCurrentDate] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const byDate = useMemo(() => {
    const map: Record<string, { pnl: number, count: number }> = {}
    for (const t of trades) {
      const d = new Date(t.date + 'Z')
      const ds = dateKey(d)
      if (!map[ds]) map[ds] = { pnl: 0, count: 0 }
      map[ds].pnl += t.pnl_pct
      map[ds].count += 1
    }
    return map
  }, [trades])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const startDay = firstDay === 0 ? 6 : firstDay - 1
  const cells: (Date | null)[] = Array(startDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i))
  while (cells.length % 7) cells.push(null)

  const monthLabel = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  const nav = (delta: number) => { const n = new Date(currentDate); n.setMonth(n.getMonth() + delta); setCurrentDate(n) }

  return (
    <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => nav(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-[#64748B] transition-colors hover:bg-gray-100">&lt;</button>
        <div className="text-center">
          <h3 className="text-base font-bold text-[#0F172A]">{monthLabel}</h3>
          <p className="mt-0.5 text-xs font-medium text-[#64748B]">Click a day to open journal. Click week row via any day to edit weekly plan.</p>
        </div>
        <button onClick={() => nav(1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-[#64748B] transition-colors hover:bg-gray-100">&gt;</button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`} className="min-h-[74px] rounded-xl border border-dashed border-[#F1F5F9] md:min-h-[96px]" />
          const ds = dateKey(date)
          const stat = byDate[ds]
          const hasJournal = journalDates.has(ds)
          const isSelectedWeek = weekStartOf(date) === selectedWeek
          let cardClass = isSelectedWeek ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-[#F1F5F9]'
          let textClass = 'text-[#94A3B8]'
          let pnlClass = 'text-[#94A3B8]'
          if (stat) {
            if (stat.pnl > 0) { cardClass = isSelectedWeek ? 'bg-green-50 border-green-200 ring-1 ring-green-100' : 'bg-green-50/60 border-green-100'; textClass = 'text-[#059669]'; pnlClass = 'text-[#059669]' }
            else if (stat.pnl < 0) { cardClass = isSelectedWeek ? 'bg-red-50 border-red-200 ring-1 ring-red-100' : 'bg-red-50/60 border-red-100'; textClass = 'text-[#DC2626]'; pnlClass = 'text-[#DC2626]' }
            else { cardClass = isSelectedWeek ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-100' : 'bg-amber-50/60 border-amber-100'; textClass = 'text-[#D97706]'; pnlClass = 'text-[#D97706]' }
          }
          return (
            <div key={ds} className={`min-h-[74px] rounded-xl border p-2 transition-all hover:-translate-y-0.5 hover:shadow-md md:min-h-[96px] ${cardClass}`}>
              <div className="mb-1 flex items-start justify-between">
                <button onClick={() => onWeekSelect(weekStartOf(date))} className="h-5 w-5 rounded-full text-[10px] font-bold text-[#64748B] hover:bg-white" title="Select week">
                  {hasJournal ? <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-[#2563EB]" /> : 'W'}
                </button>
                <button onClick={() => onDayClick(ds)} className={`text-xs font-semibold ${textClass}`}>{date.getDate()}</button>
              </div>
              {stat && (
                <button onClick={() => onDayClick(ds)} className="flex h-[46px] w-full flex-col items-center justify-center rounded-lg text-center hover:bg-white/55 md:h-[62px]">
                  <div className={`font-mono text-sm font-bold md:text-base ${pnlClass}`}>{fmt(stat.pnl)}</div>
                  <div className={`mt-0.5 text-[10px] ${pnlClass}`}>{stat.count} {stat.count === 1 ? 'trade' : 'trades'}</div>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Calendar() {
  const navigate = useNavigate()
  const [trades, setTrades] = useState<Trade[]>([])
  const [journalDates, setJournalDates] = useState<Set<string>>(new Set())
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()))
  const [focus, setFocus] = useState('')
  const [watchlist, setWatchlist] = useState('')
  const [riskPlan, setRiskPlan] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getTrades(), getJournalDates()]).then(([t, jd]) => {
      setTrades(t)
      setJournalDates(new Set(jd))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    getWeeklyPlan(weekStart)
      .then(p => {
        setFocus(p.focus ?? '')
        setWatchlist(p.watchlist ?? '')
        setRiskPlan(p.risk_plan ?? '')
        setNotes(p.notes ?? '')
      })
      .catch(() => {
        setFocus('')
        setWatchlist('')
        setRiskPlan('')
        setNotes('')
      })
  }, [weekStart])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    return dateKey(d)
  }, [weekStart])

  const save = async () => {
    setSaving(true)
    try {
      await saveWeeklyPlan(weekStart, { week_start: weekStart, focus, watchlist, risk_plan: riskPlan, notes })
      setToast('Weekly plan saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl border border-[#E2E8F0] border-l-[6px] border-l-[#059669] bg-white p-4 text-sm font-bold text-[#0F172A] shadow-md">
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">
            <CalendarDays size={14} /> Planning
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Calendar</h2>
          <p className="mt-1 text-sm font-medium text-[#64748B]">P&L by day plus a plan for the selected trading week.</p>
        </div>
        <button onClick={() => navigate('/journal')} className="h-[34px] rounded-lg border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-gray-50">
          Open Daily Journal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PnlCalendar
            trades={trades}
            journalDates={journalDates}
            selectedWeek={weekStart}
            onWeekSelect={setWeekStart}
            onDayClick={d => navigate(`/journal?date=${d}`)}
          />
        </div>

        <div className="xl:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Weekly Plan</h3>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">{weekStart} to {weekEnd}</p>
              </div>
              <button onClick={save} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving' : 'Save'}
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Main focus</span>
                <textarea value={focus} onChange={e => setFocus(e.target.value)} placeholder="What is the one thing to execute better this week?"
                  className="h-28 w-full resize-none rounded-xl border border-[#E2E8F0] bg-gray-50/60 p-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Watchlist</span>
                <textarea value={watchlist} onChange={e => setWatchlist(e.target.value)} placeholder="Symbols, sessions, setups to watch."
                  className="h-24 w-full resize-none rounded-xl border border-[#E2E8F0] bg-gray-50/60 p-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Risk rules</span>
                <textarea value={riskPlan} onChange={e => setRiskPlan(e.target.value)} placeholder="Max risk/day, max trades, stop conditions."
                  className="h-24 w-full resize-none rounded-xl border border-[#E2E8F0] bg-gray-50/60 p-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Notes</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Macro events, personal constraints, review notes."
                  className="h-24 w-full resize-none rounded-xl border border-[#E2E8F0] bg-gray-50/60 p-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { getJournal, createJournal, updateJournal, getJournalDates } from '../api/journal'
import type { DailyJournal } from '../api/journal'
import { getTrades } from '../api/trades'
import type { Trade } from '../types'

const MOODS = [
  { val: 1, emoji: '😡', label: 'Злость' },
  { val: 2, emoji: '☹️', label: 'Грусть' },
  { val: 3, emoji: '😐', label: 'Нейтрально' },
  { val: 4, emoji: '🙂', label: 'Отлично' },
  { val: 5, emoji: '🚀', label: 'Эйфория' },
]

function MoodPicker({ value, onChange }: { value?: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-4 justify-between max-w-[280px]">
      {MOODS.map(m => {
        const active = value === m.val
        return (
          <button key={m.val} type="button" onClick={() => onChange(m.val)} title={m.label}
            className="text-3xl focus:outline-none transition-all duration-200"
            style={{
              filter: active ? 'grayscale(0%) opacity(100%)' : 'grayscale(100%) opacity(40%)',
              transform: active ? 'scale(1.2)' : 'scale(1)',
            }}>
            {m.emoji}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Mini calendar with PnL color dots ──────────────────────────────────── */
function MiniCalendar({ tradesByDate, journalDates, selected, onSelect }: {
  tradesByDate: Record<string, { pnl: number; count: number }>
  journalDates: Set<string>
  selected: string
  onSelect: (d: string) => void
}) {
  const [cursor, setCursor] = useState(() => { const d = new Date(selected); d.setDate(1); return d })
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const startDay = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array(startDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i))
  const monthLabel = cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  const nav = (delta: number) => { const n = new Date(cursor); n.setMonth(n.getMonth() + delta); setCursor(n) }
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  return (
    <div className="p-5 border-b border-[#F1F5F9] bg-gray-50/50">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => nav(-1)} className="text-[#64748B] hover:text-[#0F172A] px-2 font-bold transition-colors">&lt;</button>
        <span className="font-bold text-sm text-[#0F172A]">{monthLabel}</span>
        <button onClick={() => nav(1)} className="text-[#64748B] hover:text-[#0F172A] px-2 font-bold transition-colors">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="text-[#94A3B8] font-bold mb-1">{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} className="p-1.5" />
          const ds = fmtDate(date)
          const stat = tradesByDate[ds]
          const isSelected = ds === selected
          const hasJournal = journalDates.has(ds)
          let cls = 'p-1.5 rounded-full cursor-pointer font-medium text-[#0F172A] hover:bg-gray-100 transition-colors relative'
          if (isSelected) cls = 'p-1.5 rounded-full bg-[#2563EB] text-white font-bold cursor-pointer shadow-sm'
          else if (stat) {
            if (stat.pnl > 0) cls = 'p-1.5 rounded-full bg-green-50 text-[#059669] font-bold cursor-pointer'
            else if (stat.pnl < 0) cls = 'p-1.5 rounded-full bg-red-50 text-[#DC2626] font-bold cursor-pointer'
            else cls = 'p-1.5 rounded-full bg-amber-50 text-[#D97706] font-bold cursor-pointer'
          }
          return (
            <div key={ds} onClick={() => onSelect(ds)} className={cls}>
              {date.getDate()}
              {hasJournal && !isSelected && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2563EB]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState(() => searchParams.get('date') || new Date().toISOString().split('T')[0])
  const [, setJournal] = useState<DailyJournal | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [preMood, setPreMood] = useState<number | null>(null)
  const [prePlan, setPrePlan] = useState('')
  const [postMood, setPostMood] = useState<number | null>(null)
  const [postLearned, setPostLearned] = useState('')

  const [allTrades, setAllTrades] = useState<Trade[]>([])
  const [journalDates, setJournalDates] = useState<Set<string>>(new Set())

  useEffect(() => { setSearchParams({ date }, { replace: true }) }, [date, setSearchParams])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  // Load trades + journal dates once
  useEffect(() => {
    getTrades().then(setAllTrades).catch(() => {})
    getJournalDates().then(d => setJournalDates(new Set(d))).catch(() => {})
  }, [saving])

  // Load journal for selected date
  useEffect(() => {
    setLoading(true)
    getJournal(date)
      .then(j => {
        setJournal(j)
        setPreMood(j.pre_mood ?? null); setPrePlan(j.pre_plan ?? '')
        setPostMood(j.post_mood ?? null); setPostLearned(j.post_learned ?? '')
      })
      .catch(() => {
        setJournal(null)
        setPreMood(null); setPrePlan(''); setPostMood(null); setPostLearned('')
      })
      .finally(() => setLoading(false))
  }, [date])

  const tradesByDate = useMemo(() => {
    const m: Record<string, { pnl: number; count: number }> = {}
    for (const t of allTrades) {
      const d = new Date(t.date + 'Z')
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (!m[ds]) m[ds] = { pnl: 0, count: 0 }
      m[ds].pnl += t.pnl_pct; m[ds].count += 1
    }
    return m
  }, [allTrades])

  const dayStat = tradesByDate[date] || { pnl: 0, count: 0 }
  const dayTrades = useMemo(() => allTrades.filter(t => {
    const d = new Date(t.date + 'Z')
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return ds === date
  }), [allTrades, date])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { date, pre_mood: preMood, pre_plan: prePlan, post_mood: postMood, post_learned: postLearned }
      if (journalDates.has(date)) await updateJournal(date, payload)
      else await createJournal(payload)
      setToast({ msg: 'Запись сохранена', type: 'ok' })
      setJournalDates(d => new Set(d).add(date))
    } catch {
      setToast({ msg: 'Ошибка при сохранении', type: 'err' })
    } finally { setSaving(false) }
  }

  const dateLabel = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
  const pnlColor = dayStat.pnl > 0 ? '#059669' : dayStat.pnl < 0 ? '#DC2626' : '#64748B'

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className={`flex items-center p-4 bg-white border shadow-md rounded-xl w-80 border-l-[6px] ${toast.type === 'ok' ? 'border-l-[#059669] border-[#E2E8F0]' : 'border-l-[#DC2626] border-[#E2E8F0]'}`}>
            <span className={`text-lg mr-3 font-bold ${toast.type === 'ok' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{toast.type === 'ok' ? '✓' : '✕'}</span>
            <p className="text-sm font-bold text-[#0F172A]">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Daily Journal</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1 capitalize">{dateLabel}</p>
        </div>
        <button onClick={save} disabled={saving}
          className="h-[34px] px-5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Left sidebar: Mini calendar + Entry summary ──────────── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden h-max" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <MiniCalendar tradesByDate={tradesByDate} journalDates={journalDates} selected={date} onSelect={setDate} />
          <div className="p-5">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Entry Summary</h4>
            <div className="p-4 bg-gray-50 rounded-xl border border-[#E2E8F0] mb-4" style={{ boxShadow: 'inset 0 1px 2px 0 rgba(0,0,0,0.03)' }}>
              <div className="text-[10px] text-[#64748B] mb-1 font-bold uppercase tracking-wider">Daily PnL</div>
              <div className="font-mono text-2xl font-bold mb-3" style={{ color: pnlColor }}>
                {dayStat.count ? `${dayStat.pnl > 0 ? '+' : ''}${dayStat.pnl.toFixed(2)}%` : '0.00%'}
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-[#64748B]">Trades taken</span>
                <span className="font-bold text-[#0F172A]">{dayStat.count}</span>
              </div>
            </div>

            {/* Recent journal dates */}
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 mt-6">Recent entries</h4>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {[...journalDates].sort().reverse().slice(0, 12).map(d => {
                const active = d === date
                const dt = new Date(d)
                return (
                  <button key={d} onClick={() => setDate(d)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]'}`}>
                    {dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </button>
                )
              })}
              {journalDates.size === 0 && <div className="text-xs text-[#94A3B8]">Нет записей</div>}
            </div>
          </div>
        </div>

        {/* ─── Main: Pre-Market / Post-Market split ────────────────── */}
        <div className="lg:col-span-9 flex flex-col md:flex-row gap-6">

          {/* Pre-Market */}
          <div className="flex-1 bg-white p-6 rounded-2xl border border-[#F1F5F9] flex flex-col" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Sun size={20} className="text-[#D97706]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Pre-Market</h3>
                <p className="text-xs font-medium text-[#64748B]">Preparation & Focus</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-4">State of Mind</label>
              <MoodPicker value={preMood} onChange={setPreMood} />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Game Plan / Expectations</label>
              <textarea value={prePlan} onChange={e => setPrePlan(e.target.value)}
                disabled={loading}
                placeholder="What is the main focus for today? Which pairs are in play?..."
                className="w-full h-56 md:flex-1 p-4 bg-gray-50/50 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none transition-all font-medium leading-relaxed"
                style={{ boxShadow: 'inset 0 1px 2px 0 rgba(0,0,0,0.03)' }} />
            </div>
          </div>

          {/* Post-Market */}
          <div className="flex-1 bg-white p-6 rounded-2xl border border-[#F1F5F9] flex flex-col" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Moon size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Post-Market</h3>
                <p className="text-xs font-medium text-[#64748B]">Review & Lessons</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-4">Ending Mood</label>
              <MoodPicker value={postMood} onChange={setPostMood} />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Lessons Learned</label>
              <textarea value={postLearned} onChange={e => setPostLearned(e.target.value)}
                disabled={loading}
                placeholder="Did I follow the plan? What went wrong?..."
                className="w-full h-56 md:flex-1 p-4 bg-gray-50/50 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none transition-all font-medium leading-relaxed"
                style={{ boxShadow: 'inset 0 1px 2px 0 rgba(0,0,0,0.03)' }} />
            </div>
          </div>

        </div>
      </div>

      {/* Trades for this day */}
      {dayTrades.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Trades on this day ({dayTrades.length})</h3>
          <div className="flex flex-col gap-2">
            {dayTrades.map(t => {
              const c = t.pnl_pct > 0 ? '#059669' : t.pnl_pct < 0 ? '#DC2626' : '#64748B'
              return (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#F1F5F9]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#0F172A]">{t.symbol.slice(0,2)}</div>
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">{t.symbol}</div>
                      <div className="text-[11px] text-[#64748B] capitalize">{t.direction} • {t.session.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold" style={{ color: c }}>
                    {t.result === 'b/e' ? '0.00%' : `${t.pnl_pct > 0 ? '+' : ''}${t.pnl_pct.toFixed(2)}%`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

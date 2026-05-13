import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Zap, Sparkles, Plus } from 'lucide-react'
import { getSummary, getPnlCurve, getByPsychology, getByFactor, getJournalCorrelation } from '../api/stats'
import { getTrades } from '../api/trades'
import { getJournalDates } from '../api/journal'
import type { StatsSummary, PnlPoint, Trade, TagStat, FactorStat, MoodStat } from '../types'
import { useSettings, fmtMoney } from '../contexts/SettingsContext'
import DailyLossBanner from '../components/DailyLossBanner'
import PerformanceHeatmap from '../components/PerformanceHeatmap'

const COLORS = {
  primary: '#2563EB', success: '#059669', error: '#DC2626', warning: '#D97706',
  text: '#0F172A', muted: '#64748B', dim: '#94A3B8',
  borderSubtle: '#F1F5F9', border: '#E2E8F0',
  bg: '#F3F4F6', surface: '#FFFFFF',
}

const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const pnlColor = (v: number) => v > 0 ? COLORS.success : v < 0 ? COLORS.error : COLORS.muted

type Period = 'all' | 'week' | 'month'

function getRange(period: Period, offset: number): { from?: string; to?: string; label: string } {
  if (period === 'all') return { label: 'All time' }
  const now = new Date()
  if (period === 'week') {
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
    mon.setHours(0, 0, 0, 0)
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4); fri.setHours(23, 59, 59, 999)
    const f = (d: Date) => d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    return { from: mon.toISOString(), to: fri.toISOString(), label: `${f(mon)} – ${f(fri)}` }
  }
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const start = new Date(d.getFullYear(), d.getMonth(), 1); start.setHours(0,0,0,0)
  const end = new Date(d.getFullYear(), d.getMonth()+1, 0); end.setHours(23,59,59,999)
  return { from: start.toISOString(), to: end.toISOString(), label: start.toLocaleDateString('en', { month: 'long', year: 'numeric' }) }
}

/* ─── KPI Card ─────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, subColor, icon, iconBg, iconColor }: {
  label: string; value: string; sub?: string; subColor?: 'success' | 'error' | 'muted';
  icon: React.ReactNode; iconBg: string; iconColor: string;
}) {
  const subClass = subColor === 'success' ? 'text-[#059669] bg-green-50 border-green-100'
    : subColor === 'error' ? 'text-[#DC2626] bg-red-50 border-red-100'
    : 'text-[#64748B]'
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#F1F5F9] flex flex-col justify-between transition-shadow hover:shadow-md" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</span>
        <span className="p-1.5 rounded-md font-bold text-lg leading-none flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>{icon}</span>
      </div>
      <div>
        <div className="font-mono text-3xl font-bold text-[#0F172A] mb-1 tracking-tight">{value}</div>
        {sub && <div className={`text-xs font-medium w-max px-2 py-0.5 rounded-md ${subClass} ${subColor ? 'border' : ''}`}>{sub}</div>}
      </div>
    </div>
  )
}

/* ─── Activity Feed Item ──────────────────────────────────────────────── */
function FeedItem({ t, onClick }: { t: Trade; onClick: () => void }) {
  const isWin = t.pnl_pct > 0
  const isLoss = t.pnl_pct < 0
  const iconBg = isWin ? 'bg-green-50 border-green-100 text-[#059669]'
    : isLoss ? 'bg-red-50 border-red-100 text-[#DC2626]'
    : 'bg-gray-100 border-gray-200 text-[#64748B]'
  const pnlClass = isWin ? 'text-[#059669]' : isLoss ? 'text-[#DC2626]' : 'text-[#64748B]'
  const arrow = isWin ? <TrendingUp size={16} /> : isLoss ? <TrendingDown size={16} /> : <span>—</span>
  const date = new Date(t.date + 'Z')
  const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ', ' +
                  date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const tags = [t.direction === 'long' ? 'Long' : 'Short',
                t.session.replace('_', ' '),
                ...(t.factors.slice(0, 1).map(f => f.name))].join(' • ')
  return (
    <div onClick={onClick} className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer flex gap-3 items-center border border-transparent hover:border-[#E2E8F0]">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold border ${iconBg}`}>{arrow}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="font-bold text-sm text-[#0F172A] truncate">{t.symbol}</span>
          <span className={`font-mono text-sm font-bold ${pnlClass}`}>{t.result === 'open' ? 'OPEN' : t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-[#64748B] truncate">{tags}</span>
          <span className="text-[10px] text-[#94A3B8] shrink-0 ml-2">{dateStr}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Chart Tooltip ───────────────────────────────────────────────────── */
function ChartTip({ active, payload }: { active?: boolean; payload?: { payload: PnlPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-md">
      <div className="text-xs text-[#64748B]">{d.date}</div>
      <div className={`font-mono font-bold text-sm ${d.pnl_pct > 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{fmt(d.pnl_pct)}</div>
    </div>
  )
}

/* ─── PnL Calendar ──────────────────────────────────────────────────── */
function PnlCalendar({ trades, journalDates, onDayClick }: { trades: Trade[]; journalDates: Set<string>; onDayClick: (date: string) => void }) {
  const [currentDate, setCurrentDate] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const byDate = useMemo(() => {
    const map: Record<string, { pnl: number, count: number }> = {}
    for (const t of trades) {
      const d = new Date(t.date + 'Z')
      const ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      if (!map[ds]) map[ds] = { pnl: 0, count: 0 }
      map[ds].pnl += t.pnl_pct; map[ds].count += 1
    }
    return map
  }, [trades])
  const year = currentDate.getFullYear(), month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const startDay = firstDay === 0 ? 6 : firstDay - 1
  const cells: (Date | null)[] = Array(startDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i))
  while (cells.length % 7) cells.push(null)
  const monthLabel = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  const nav = (delta: number) => { const n = new Date(currentDate); n.setMonth(n.getMonth() + delta); setCurrentDate(n) }
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => nav(-1)} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-[#64748B] font-bold transition-colors">‹</button>
        <span className="text-base font-bold text-[#0F172A]">{monthLabel}</span>
        <button onClick={() => nav(1)} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-[#64748B] font-bold transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} className="text-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`} className="min-h-[78px] rounded-xl border border-dashed border-[#F1F5F9]" />
          const ds = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0')
          const stat = byDate[ds]
          const hasJournal = journalDates.has(ds)
          let cardClass = 'bg-white border-[#F1F5F9]'
          let textClass = 'text-[#94A3B8]'
          let pnlClass = 'text-[#94A3B8]'
          if (stat) {
            if (stat.pnl > 0) { cardClass = 'bg-green-50/60 border-green-100'; textClass = 'text-[#059669]'; pnlClass = 'text-[#059669]' }
            else if (stat.pnl < 0) { cardClass = 'bg-red-50/60 border-red-100'; textClass = 'text-[#DC2626]'; pnlClass = 'text-[#DC2626]' }
            else { cardClass = 'bg-amber-50/60 border-amber-100'; textClass = 'text-[#D97706]'; pnlClass = 'text-[#D97706]' }
          }
          return (
            <div key={ds} onClick={() => onDayClick(ds)}
              className={`min-h-[78px] rounded-xl border p-2 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${cardClass}`}>
              <div className="flex justify-between items-start">
                {hasJournal ? <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: COLORS.primary }} /> : <div className="w-1.5" />}
                <div className={`text-xs font-semibold ${textClass}`}>{date.getDate()}</div>
              </div>
              {stat && (
                <div className="flex-1 flex flex-col items-center justify-center mt-1">
                  <div className={`font-mono text-sm font-bold ${pnlClass}`}>{fmt(stat.pnl)}</div>
                  <div className={`text-[10px] opacity-80 mt-0.5 ${pnlClass}`}>{stat.count} {stat.count === 1 ? 'trade' : 'trades'}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── MAIN ─────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [period, setPeriod] = useState<Period>('all')
  const [offset, setOffset] = useState(0)
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [curve, setCurve] = useState<PnlPoint[]>([])
  const [allTrades, setAllTrades] = useState<Trade[]>([])
  const [psychStats, setPsychStats] = useState<TagStat[]>([])
  const [factorStats, setFactorStats] = useState<FactorStat[]>([])
  const [moodStats, setMoodStats] = useState<MoodStat[]>([])
  const [journalDates, setJournalDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const range = getRange(period, offset)

  useEffect(() => {
    setLoading(true)
    const r = range.from ? { from: range.from, to: range.to } : undefined
    Promise.all([
      getSummary(r), getPnlCurve(r),
      getTrades(r ? { from: range.from, to: range.to } : undefined),
      getByPsychology(r), getByFactor(r), getJournalCorrelation(r),
      getJournalDates(),
    ]).then(([s, c, t, ps, fs, ms, jd]) => {
      setSummary(s); setCurve(c)
      setAllTrades(t); setPsychStats(ps); setFactorStats(fs); setMoodStats(ms)
      setJournalDates(new Set(jd))
    }).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, offset])

  const recent = allTrades.slice(0, 5)

  /* ─── Empty/Loading states ──────────────────────────────────────────── */
  if (loading) return <div className="text-[#64748B] text-base">Loading...</div>

  const Header = () => (
    <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Dashboard</h2>
        <p className="text-sm font-medium text-[#64748B] mt-1">{range.label} • {summary?.total_trades || 0} trades</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          {(['all', 'month', 'week'] as Period[]).map(p => (
            <button key={p} onClick={() => { setPeriod(p); setOffset(0) }}
              className={`px-4 py-1.5 rounded-md text-xs transition-colors ${period === p ? 'bg-gray-100 text-[#0F172A] font-semibold' : 'text-[#64748B] hover:text-[#0F172A] font-medium'}`}>
              {p === 'all' ? 'All Time' : p === 'month' ? 'Month' : 'Week'}
            </button>
          ))}
        </div>
        {period !== 'all' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setOffset(o => o - 1)} className="w-8 h-8 rounded-md border border-[#E2E8F0] hover:bg-gray-50 text-[#64748B]">‹</button>
            <span className="text-xs text-[#0F172A] min-w-[110px] text-center font-medium">{range.label}</span>
            <button onClick={() => setOffset(o => Math.min(o + 1, 0))} disabled={offset === 0}
              className="w-8 h-8 rounded-md border border-[#E2E8F0] hover:bg-gray-50 text-[#64748B] disabled:opacity-30">›</button>
          </div>
        )}
        <button onClick={() => navigate('/add')}
          className="h-[34px] px-5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1.5"
          style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <Plus size={14} strokeWidth={2.5} /> Log Trade
        </button>
      </div>
    </div>
  )

  if (!summary || summary.total_trades === 0) {
    return (
      <div>
        <Header />
        <div className="bg-white rounded-2xl border border-[#F1F5F9] p-12 text-center" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <p className="text-base text-[#64748B] mb-4">No trades{period !== 'all' ? ` for ${range.label}` : ' yet'}</p>
          {period === 'all' && <button onClick={() => navigate('/add')} className="px-5 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Add Trade</button>}
        </div>
      </div>
    )
  }

  const minY = Math.min(...curve.map(p => p.pnl_pct), 0)
  const maxY = Math.max(...curve.map(p => p.pnl_pct), 0)
  const yPad = Math.max(0.5, (maxY - minY) * 0.12)
  const profitFactor = summary.avg_loss ? Math.abs(summary.avg_win / summary.avg_loss) : 0

  // Session stats
  const sessionData: Record<string, { name: string; trades: number; wins: number; color: string }> = {
    london:   { name: 'London',   trades: 0, wins: 0, color: COLORS.success },
    new_york: { name: 'New York', trades: 0, wins: 0, color: COLORS.warning },
    asian:    { name: 'Asian',    trades: 0, wins: 0, color: COLORS.error },
    overlap:  { name: 'L/NY Overlap', trades: 0, wins: 0, color: COLORS.primary },
  }
  for (const t of allTrades) {
    if (t.result === 'open') continue
    if (sessionData[t.session]) { sessionData[t.session].trades++; if (t.pnl_pct > 0) sessionData[t.session].wins++ }
  }

  // Top tags by PnL
  const tagWithPnl = psychStats.map(p => ({
    tag: p.tag.split('/')[0].trim(),
    pnl: p.avg_pnl_pct * p.total_trades,
  })).filter(x => x.tag && x.tag !== 'По системе')
  const topProfit = [...tagWithPnl].sort((a, b) => b.pnl - a.pnl).slice(0, 2).filter(x => x.pnl > 0)
  const topLoss = [...tagWithPnl].sort((a, b) => a.pnl - b.pnl).slice(0, 2).filter(x => x.pnl < 0)

  const bySystem = psychStats.find(p => p.tag.includes('системе'))
  const disciplineRate = bySystem ? Math.round((bySystem.total_trades / summary.total_trades) * 100) : 0

  return (
    <div>
      <Header />
      <DailyLossBanner trades={allTrades} />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 mb-5">
        <div className="lg:col-span-3"><KpiCard label="Net P&L" value={fmt(summary.total_pnl_pct)}
          sub={settings ? `${fmtMoney(summary.total_pnl_pct, settings.account_size, settings.currency)} • ${summary.total_trades} trades` : `${summary.total_trades} trades`} subColor={summary.total_pnl_pct > 0 ? 'success' : 'error'}
          icon={<TrendingUp size={16} />} iconBg="#ECFDF5" iconColor="#059669" /></div>
        <div className="lg:col-span-3"><KpiCard label="Win Rate" value={`${summary.winrate}%`}
          sub={`avg win ${fmt(summary.avg_win)} • loss ${fmt(summary.avg_loss)}`}
          icon={<Zap size={16} />} iconBg="#EFF6FF" iconColor="#2563EB" /></div>
        <div className="lg:col-span-3"><KpiCard label="Profit Factor" value={profitFactor.toFixed(2)}
          sub={`Avg RR 1:${profitFactor.toFixed(1)}`}
          icon={<Sparkles size={16} />} iconBg="#FAF5FF" iconColor="#9333EA" /></div>
        <div className="lg:col-span-3"><KpiCard label="Max Drawdown" value={`-${summary.max_drawdown.toFixed(2)}%`}
          sub={summary.max_drawdown > 5 ? 'Above safety limit' : 'Within tolerance'}
          subColor={summary.max_drawdown > 5 ? 'error' : 'success'}
          icon={<TrendingDown size={16} />} iconBg="#FEF2F2" iconColor="#DC2626" /></div>

        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#F1F5F9] flex flex-col" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Cumulative Equity</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Growth over selected period</p>
            </div>
            <div className="text-right">
              <div className={`font-mono text-2xl font-bold ${summary.total_pnl_pct >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{fmt(summary.total_pnl_pct)}</div>
              {settings && <div className={`font-mono text-xs font-medium ${summary.total_pnl_pct >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{fmtMoney(summary.total_pnl_pct, settings.account_size, settings.currency)}</div>}
            </div>
          </div>
          <div className="flex-1" style={{ minHeight: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={[minY - yPad, maxY + yPad]} hide />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={0} stroke="#E2E8F0" strokeDasharray="4 6" />
                <Area type="monotone" dataKey="pnl_pct" stroke={COLORS.primary} strokeWidth={2.5}
                  fill="url(#pnlGrad)" dot={false} activeDot={{ r: 5, fill: COLORS.primary, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#F1F5F9] flex flex-col overflow-hidden" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)', minHeight: 380 }}>
          <div className="p-5 border-b border-[#F1F5F9] bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0F172A]">Activity Feed</h3>
            <button onClick={() => navigate('/trades')} className="text-xs font-semibold text-[#2563EB] hover:underline">View grid →</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {recent.map(t => <FeedItem key={t.id} t={t} onClick={() => navigate(`/trade/${t.id}`)} />)}
            {recent.length === 0 && <div className="text-center text-sm text-[#94A3B8] py-8">No trades yet</div>}
          </div>
        </div>

        {/* Performance Drivers */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Performance Drivers</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-[#64748B]">По системе (Discipline)</span>
                <span className="font-bold text-[#0F172A]">{disciplineRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#2563EB] h-2 rounded-full transition-all" style={{ width: `${disciplineRate}%` }} />
              </div>
            </div>
            {psychStats.filter(p => !p.tag.includes('системе')).slice(0, 3).map(p => {
              const wr = p.winrate
              const color = wr >= 50 ? '#059669' : wr >= 30 ? '#D97706' : '#DC2626'
              const tagName = p.tag.split('/')[0].trim()
              return (
                <div key={p.tag}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#64748B]">Winrate "{tagName}"</span>
                    <span className="font-bold" style={{ color }}>{wr}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${wr}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
            <h4 className="text-[10px] text-[#64748B] uppercase tracking-wider mb-3 font-bold">Top Tags (Profit vs Loss)</h4>
            <div className="flex flex-wrap gap-2">
              {topProfit.map(t => (
                <span key={t.tag} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  {t.tag} <span className="ml-1.5 opacity-60 font-mono">{fmt(t.pnl)}</span>
                </span>
              ))}
              {topLoss.map(t => (
                <span key={t.tag} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  {t.tag} <span className="ml-1.5 opacity-60 font-mono">{fmt(t.pnl)}</span>
                </span>
              ))}
              {topProfit.length === 0 && topLoss.length === 0 && (
                <span className="text-xs text-[#94A3B8]">Not enough data</span>
              )}
            </div>
          </div>
        </div>

        {/* Session Matrix */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Session Matrix</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(sessionData).map(s => {
              const wr = s.trades ? Math.round(s.wins / s.trades * 100) : 0
              const hasData = s.trades > 0
              return (
                <div key={s.name} className={`bg-gray-50 rounded-xl p-4 flex flex-col justify-center border border-transparent hover:border-[#E2E8F0] transition-colors ${hasData ? '' : 'opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: hasData ? s.color : '#CBD5E1' }} />
                    <div className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wide">{s.name}</div>
                  </div>
                  <div className="font-mono text-2xl font-bold" style={{ color: hasData ? s.color : '#64748B' }}>
                    {hasData ? `${wr}%` : '—'}
                    {hasData && <span className="text-[10px] text-[#64748B] font-sans font-medium ml-1">Win Rate</span>}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">{hasData ? `${s.trades} trades logged` : 'No data'}</div>
                </div>
              )
            })}
          </div>
          {/* Mood correlation */}
          {moodStats.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#F1F5F9]">
              <h4 className="text-[10px] text-[#64748B] uppercase tracking-wider mb-3 font-bold">Mood ↔ Result</h4>
              <div className="grid grid-cols-5 gap-2">
                {moodStats.map(m => (
                  <div key={m.mood} className="bg-gray-50 rounded-lg p-2 text-center border border-[#F1F5F9]">
                    <div className="text-xl mb-0.5">{['😡','☹️','😐','🙂','🚀'][m.mood - 1]}</div>
                    <div className="font-mono text-xs font-bold" style={{ color: pnlColor(m.avg_pnl_pct) }}>{fmt(m.avg_pnl_pct)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white p-6 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-bold text-[#0F172A]">P&L Calendar</h3>
          <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#2563EB]" /> есть запись в дневнике
          </span>
        </div>
        <PnlCalendar trades={allTrades} journalDates={journalDates} onDayClick={d => navigate(`/journal?date=${d}`)} />
      </div>

      <div className="mt-5">
        <PerformanceHeatmap trades={allTrades} />
      </div>

      {/* Factors used */}
      {factorStats.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#F1F5F9] mt-5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Most Used Factors</h3>
          <div className="flex flex-wrap gap-2">
            {factorStats.slice(0, 10).map(f => (
              <span key={f.factor} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                {f.factor} <span className="ml-1.5 opacity-60 font-mono">×{f.total_trades}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import { getSummary, getPnlCurve, getByPsychology, getByFactor, getJournalCorrelation } from '../api/stats'
import { getTrades } from '../api/trades'
import { getJournalDates } from '../api/journal'
import type { StatsSummary, PnlPoint, Trade, TagStat, FactorStat, MoodStat } from '../types'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" }

function pnlFmt(v: number) { return `${v > 0 ? '+' : ''}${v.toFixed(2)}%` }
function pnlColor(v: number) { return v > 0 ? C.green : v < 0 ? C.red : C.muted }

function StatCard({ label, value, color = C.text, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>{label}</div>
      <div style={{ ...mono, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>{sub}</div>}
    </div>
  )
}

function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function ChartTip({ active, payload }: { active?: boolean; payload?: { payload: PnlPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 13, color: C.muted }}>{d.date}</div>
      <div style={{ ...mono, fontWeight: 700, fontSize: 15, color: pnlColor(d.pnl_pct) }}>{pnlFmt(d.pnl_pct)}</div>
    </div>
  )
}

function TradeItem({ t }: { t: Trade }) {
  const dirColor = t.direction === 'long' ? C.green : C.red
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10, marginBottom: 8,
      background: C.item, border: `1px solid rgba(0,0,0,0.05)`,
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)')}
    >
      <div style={{ minWidth: 60 }}>
        <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.text }}>{t.symbol}</div>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.4px', display: 'inline-block', marginTop: 4,
          color: dirColor,
          background: t.direction === 'long' ? 'rgba(61,255,160,0.1)' : 'rgba(249,115,22,0.1)',
          border: `1px solid ${t.direction === 'long' ? 'rgba(61,255,160,0.2)' : 'rgba(249,115,22,0.2)'}`,
        }}>
          {t.direction}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.muted }}>
          {new Date(t.date + 'Z').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} · {t.session.replace('_', ' ')}
        </div>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
          {t.factors.slice(0, 2).map(f => f.name).join(' · ') || '—'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ ...mono, fontSize: 15, fontWeight: 700, color: pnlColor(t.pnl_pct) }}>
          {t.result === 'b/e' ? 'B/E' : pnlFmt(t.pnl_pct)}
        </div>
        <div style={{ fontSize: 12, marginTop: 3, color: C.dim }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{ color: i <= t.rating ? C.red : C.dim }}>{i <= t.rating ? '♥' : '♡'}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

type SessionStat = { name: string; trades: number; wins: number; color: string }
function sessionStats(trades: Trade[]): SessionStat[] {
  const map: Record<string, SessionStat> = {
    london:   { name: 'London',   trades: 0, wins: 0, color: C.green },
    new_york: { name: 'New York', trades: 0, wins: 0, color: C.yellow },
    asian:    { name: 'Asian',    trades: 0, wins: 0, color: C.red },
    overlap:  { name: 'Overlap',  trades: 0, wins: 0, color: C.blue },
  }
  for (const t of trades) {
    if (map[t.session]) { map[t.session].trades++; if (t.pnl_pct > 0) map[t.session].wins++ }
  }
  return Object.values(map)
}

type Period = 'all' | 'week' | 'month'

function getRange(period: Period, offset: number): { from?: string; to?: string; label: string } {
  if (period === 'all') return { label: 'All time' }
  const now = new Date()
  if (period === 'week') {
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
    mon.setHours(0, 0, 0, 0)
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4); fri.setHours(23, 59, 59, 999)
    const fmt = (d: Date) => d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
    return { from: mon.toISOString(), to: fri.toISOString(), label: `${fmt(mon)} – ${fmt(fri)}` }
  }
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return {
    from: start.toISOString(), to: end.toISOString(),
    label: start.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
  }
}

function PnlCalendar({ trades, journalDates, onDayClick }: { trades: Trade[]; journalDates: Set<string>; onDayClick: (date: string) => void }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0,0,0,0)
    return d
  })

  const byDate = useMemo(() => {
    const map: Record<string, { pnl: number, count: number }> = {}
    for (const t of trades) {
      const d = new Date(t.date + 'Z')
      const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0 }
      map[dateStr].pnl += t.pnl_pct
      map[dateStr].count += 1
    }
    return map
  }, [trades])

  const nextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
  }
  const prevMonth = () => {
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const startDay = firstDay === 0 ? 6 : firstDay - 1

  const cells = []
  for (let i = 0; i < startDay; i++) {
    cells.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i))
  }
  
  const totalCells = Math.ceil(cells.length / 7) * 7
  while (cells.length < totalCells) {
    cells.push(null)
  }

  const monthLabel = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ 
          background: C.item, border: `1px solid ${C.border}`, borderRadius: 8, 
          width: 38, height: 38, cursor: 'pointer', color: C.text, fontSize: 18, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ 
          background: C.item, border: `1px solid ${C.border}`, borderRadius: 8, 
          width: 38, height: 38, cursor: 'pointer', color: C.text, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>›</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 13, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>{d}</div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} style={{ minHeight: 90, background: 'rgba(0,0,0,0.01)', borderRadius: 12, border: `1px dashed ${C.border}` }} />
          
          const dateStr = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0')
          const stat = byDate[dateStr]
          
          let bg = C.card
          let border = C.border
          let textColor = C.text
          
          if (stat) {
            if (stat.pnl > 0) {
              bg = 'rgba(16,185,129,0.1)'
              border = 'rgba(16,185,129,0.3)'
              textColor = C.green
            } else if (stat.pnl < 0) {
              bg = 'rgba(249,115,22,0.1)'
              border = 'rgba(249,115,22,0.3)'
              textColor = C.orange
            } else {
              bg = 'rgba(245,158,11,0.1)'
              border = 'rgba(245,158,11,0.3)'
              textColor = C.yellow
            }
          }
          
          const hasJournal = journalDates.has(dateStr)

          return (
            <div key={dateStr}
              onClick={() => onDayClick(dateStr)}
              title={hasJournal ? 'Открыть дневник' : 'Создать запись в дневнике'}
              style={{
                minHeight: 90, borderRadius: 12, border: `1px solid ${border}`, background: bg,
                padding: '10px', display: 'flex', flexDirection: 'column', transition: 'all 0.15s',
                cursor: 'pointer', position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {hasJournal ? (
                  <div title="Есть запись в дневнике" style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: C.purple, marginTop: 2, flexShrink: 0,
                  }} />
                ) : <div style={{ width: 7 }} />}
                <div style={{ fontSize: 13, color: stat ? textColor : C.dim, fontWeight: 600, opacity: stat ? 1 : 0.6 }}>{date.getDate()}</div>
              </div>
              {stat ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: textColor }}>{stat.pnl > 0 ? '+' : ''}{stat.pnl.toFixed(2)}%</div>
                  <div style={{ fontSize: 12, color: textColor, opacity: 0.8, marginTop: 4, fontWeight: 500 }}>{stat.count} {stat.count === 1 ? 'trade' : 'trades'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('all')
  const [offset, setOffset] = useState(0)
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [curve, setCurve] = useState<PnlPoint[]>([])
  const [recent, setRecent] = useState<Trade[]>([])
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
      setSummary(s); setCurve(c); setRecent(t.slice(0, 4))
      setAllTrades(t); setPsychStats(ps); setFactorStats(fs); setMoodStats(ms)
      setJournalDates(new Set(jd))
    }).finally(() => setLoading(false))
  }, [period, offset])

  const handlePeriod = (p: Period) => { setPeriod(p); setOffset(0) }

  const Btn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} style={{
      background: C.purpleBtn, color: '#ffffff', border: 'none', borderRadius: 8,
      padding: '9px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = C.purple)}
      onMouseLeave={e => (e.currentTarget.style.background = C.purpleBtn)}
    >{children}</button>
  )

  const PeriodFilter = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {(['all', 'week', 'month'] as Period[]).map(p => (
        <button key={p} onClick={() => handlePeriod(p)} style={{
          background: period === p ? 'rgba(124,115,255,0.2)' : 'transparent',
          color: period === p ? '#8b84ff' : C.muted,
          border: `1px solid ${period === p ? 'rgba(124,115,255,0.4)' : C.border}`,
          borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}>
          {p === 'all' ? 'All' : p === 'week' ? 'Week' : 'Month'}
        </button>
      ))}
      {period !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
          <button onClick={() => setOffset(o => o - 1)} style={{
            background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <span style={{ fontSize: 13, color: C.text, minWidth: 120, textAlign: 'center' }}>{range.label}</span>
          <button onClick={() => setOffset(o => Math.min(o + 1, 0))} disabled={offset === 0} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: offset === 0 ? C.dim : C.muted,
            borderRadius: 6, width: 28, height: 28, cursor: offset === 0 ? 'default' : 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: offset === 0 ? 0.3 : 1,
          }}>›</button>
        </div>
      )}
    </div>
  )

  if (loading) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700 }}>Dashboard</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <PeriodFilter />
          <Btn onClick={() => navigate('/add')}>+ Add Trade</Btn>
        </div>
      </div>
      <p style={{ color: C.muted, fontSize: 15 }}>Loading...</p>
    </div>
  )

  if (!summary || summary.total_trades === 0) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700 }}>Dashboard</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <PeriodFilter />
            <Btn onClick={() => navigate('/add')}>+ Add Trade</Btn>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: C.muted }}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>No trades{period !== 'all' ? ` for ${range.label}` : ' yet'}</p>
          {period === 'all' && <Btn onClick={() => navigate('/add')}>+ Add Trade</Btn>}
        </div>
      </div>
    )
  }

  const minY = Math.min(...curve.map(p => p.pnl_pct), 0)
  const maxY = Math.max(...curve.map(p => p.pnl_pct), 0)
  const yPad = Math.max(0.5, (maxY - minY) * 0.12)
  const bySession = sessionStats(allTrades)
  const bySystemStat = psychStats.find(p => p.tag.includes('системе'))
  const worstPsych = [...psychStats]
    .filter(p => !p.tag.includes('системе'))
    .sort((a, b) => (a.avg_pnl_pct * a.total_trades) - (b.avg_pnl_pct * b.total_trades))[0]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700 }}>Dashboard</div>
          <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>
            {range.label} · {summary.total_trades} trades
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <PeriodFilter />
          <Btn onClick={() => navigate('/add')}>+ Add Trade</Btn>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total P&L"  value={pnlFmt(summary.total_pnl_pct)} color={pnlColor(summary.total_pnl_pct)} sub={`${summary.total_trades} trades`} />
        <StatCard label="Win Rate"   value={`${summary.winrate}%`} color={C.text} />
        <StatCard label="Avg RR"     value={`${(summary.avg_win / Math.abs(summary.avg_loss || 1)).toFixed(1)}`} color={C.blue} sub="win / loss ratio" />
        <StatCard label="Max DD"     value={`-${summary.max_drawdown.toFixed(2)}%`} color={C.red} />
        <StatCard label="Best Trade" value={summary.best_trade ? pnlFmt(summary.best_trade.pnl_pct) : '—'} color={C.yellow} sub={summary.best_trade?.symbol} />
      </div>

      {/* Chart + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16, marginBottom: 16 }}>
        <Card title="Cumulative P&L"
          right={<span style={{ ...mono, fontSize: 26, fontWeight: 700, color: pnlColor(summary.total_pnl_pct) }}>{pnlFmt(summary.total_pnl_pct)}</span>}
        >
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3dffa0" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3dffa0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={[minY - yPad, maxY + yPad]} hide />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.05)" strokeDasharray="4 6" />
                <Area type="monotone" dataKey="pnl_pct" stroke={C.green} strokeWidth={2}
                  fill="url(#pnlGrad)" dot={false} activeDot={{ r: 5, fill: C.green, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Trades"
          right={<span style={{ fontSize: 13, color: C.dim, cursor: 'pointer' }}
            onClick={() => navigate('/trades')}
            onMouseEnter={e => (e.currentTarget.style.color = C.muted)}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
          >All →</span>}
        >
          {recent.map(t => <TradeItem key={t.id} t={t} />)}
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Psychology breakdown">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'По системе',        value: bySystemStat ? `${bySystemStat.total_trades} / ${summary.total_trades}` : '—', color: C.green },
              { label: 'Winrate (by system)', value: bySystemStat ? `${bySystemStat.winrate}%` : '—', color: C.text },
              { label: 'Worst tag',          value: worstPsych?.tag.split('/')[0].trim().slice(0, 14) ?? '—', color: C.red },
              { label: 'Avg rating',         value: allTrades.length ? `${(allTrades.reduce((s, t) => s + t.rating, 0) / allTrades.length).toFixed(1)} ♥` : '—', color: C.yellow },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.item, border: `1px solid rgba(0,0,0,0.05)`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Most used factors</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {factorStats.slice(0, 5).map(f => (
              <div key={f.factor} style={{
                padding: '5px 12px', borderRadius: 7,
                border: `1px solid rgba(124,115,255,0.4)`, background: 'rgba(124,115,255,0.1)',
                ...mono, fontSize: 12, color: C.purple,
              }}>
                {f.factor} · {f.total_trades}
              </div>
            ))}
          
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Корреляция Эмоции ↔ Результат</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {moodStats.length > 0 ? moodStats.map(m => (
                <div key={m.mood} style={{ background: C.item, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{['😡','☹️','😐','🙂','🚀'][m.mood - 1]}</div>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: m.avg_pnl_pct > 0 ? C.green : m.avg_pnl_pct < 0 ? C.orange : C.text }}>{m.avg_pnl_pct > 0 ? '+' : ''}{m.avg_pnl_pct.toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{m.total_trades} {m.total_trades === 1 ? 'trade' : 'trades'}</div>
                </div>
              )) : <div style={{ fontSize: 13, color: C.dim, gridColumn: 'span 5' }}>Нет записей в дневнике за период</div>}
            </div>
          </div>

        </Card>

        <Card title="By session">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {bySession.map(s => {
              const wr = s.trades ? Math.round(s.wins / s.trades * 100) : 0
              return (
                <div key={s.name} style={{ background: C.item, border: `1px solid rgba(0,0,0,0.05)`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.name}</div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: s.trades ? s.color : C.dim }}>{s.trades ? `${wr}%` : '—'}</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{s.trades} {s.trades === 1 ? 'trade' : 'trades'}</div>
                  <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${wr}%`, background: s.color, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Calendar row */}
      <div style={{ marginTop: 16 }}>
        <Card title="P&L Calendar (Heatmap)" right={
          <span style={{ fontSize: 12, color: C.dim }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.purple, marginRight: 5, verticalAlign: 'middle' }} />
            есть запись в дневнике
          </span>
        }>
          <PnlCalendar
            trades={allTrades}
            journalDates={journalDates}
            onDayClick={(date) => navigate(`/journal?date=${date}`)}
          />
        </Card>
      </div>
    </div>
  )
}

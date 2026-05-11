import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrades, deleteTrade, importHtml, getExportUrl } from '../api/trades'
import type { Trade } from '../types'

const C = {
  card: '#ffffff', item: '#F8FAFC', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', dim: '#94A3B8',
  green: '#059669', red: '#DC2626', yellow: '#D97706', purple: '#2563EB', blue: '#2563EB',
  purpleBtn: '#2563EB', orange: '#DC2626'
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

type SortField = 'date' | 'symbol' | 'pnl_pct' | 'rating' | 'rr'
type SortDir   = 'asc' | 'desc'
interface Filters {
  symbol: string; direction: string; result: string; rating: string
  from: string; to: string
}

function pnlColor(v: number) { return v > 0 ? C.green : v < 0 ? C.red : C.muted }
function pnlFmt(v: number)   { return `${v > 0 ? '+' : ''}${v.toFixed(2)}%` }

function DirBadge({ dir }: { dir: string }) {
  const long = dir === 'long'
  return (
    <span style={{
      fontSize: 13, padding: '4px 10px', borderRadius: 5, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.4px',
      color: long ? C.green : C.red,
      background: long ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${long ? '#BBF7D0' : '#FECACA'}`,
    }}>
      {long ? '▲ Long' : '▼ Short'}
    </span>
  )
}

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span style={{ color: C.dim, fontSize: 14 }}>—</span>
  const trend = type === 'trend'
  return (
    <span style={{
      fontSize: 13, padding: '4px 10px', borderRadius: 5, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.4px',
      color: trend ? C.green : C.yellow,
      background: trend ? 'rgba(61,255,160,0.1)' : 'rgba(255,209,102,0.1)',
      border: `1px solid ${trend ? 'rgba(61,255,160,0.2)' : 'rgba(255,209,102,0.2)'}`,
    }}>
      {trend ? '↗ Trend' : '↙ Counter'}
    </span>
  )
}

function ResultBadge({ result }: { result: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
    take:  { label: 'Take', color: C.green,  bg: '#F0FDF4',   border: '#BBF7D0' },
    stop:  { label: 'Stop', color: C.red,    bg: '#FEF2F2',   border: '#FECACA' },
    'b/e': { label: 'B/E',  color: C.yellow, bg: '#FFFBEB', border: '#FDE68A' },
  }
  const s = cfg[result] ?? cfg.stop
  return (
    <span style={{
      fontSize: 13, padding: '4px 10px', borderRadius: 5, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.4px',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>{s.label}</span>
  )
}

function Hearts({ v }: { v: number }) {
  return (
    <span style={{ fontSize: 16 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= v ? C.red : C.dim }}>{i <= v ? '♥' : '♡'}</span>
      ))}
    </span>
  )
}

function Tags({ items, color, bg, border }: { items: string[]; color: string; bg: string; border: string }) {
  if (!items.length) return <span style={{ color: C.dim, fontSize: 14 }}>—</span>
  const show = items.slice(0, 2)
  const rest = items.length - 2
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {show.map(t => (
        <span key={t} style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, color, background: bg, border: `1px solid ${border}` }}>{t}</span>
      ))}
      {rest > 0 && <span style={{ fontSize: 13, color: C.dim }}>+{rest}</span>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '8px 14px', fontSize: 14, color: C.text, outline: 'none',
  fontFamily: 'inherit', cursor: 'pointer',
}

// ─── PDF generator (browser print → Save as PDF) ─────────────────────────────
function exportPdf(trades: Trade[], filters: Filters) {
  const totalPnl  = trades.reduce((s, t) => s + t.pnl_pct, 0)
  const wins      = trades.filter(t => t.pnl_pct > 0).length
  const losses    = trades.filter(t => t.pnl_pct < 0).length
  const winrate   = trades.length ? Math.round(wins / trades.length * 100) : 0
  const avgWin    = wins   ? trades.filter(t => t.pnl_pct > 0).reduce((s, t) => s + t.pnl_pct, 0) / wins   : 0
  const avgLoss   = losses ? trades.filter(t => t.pnl_pct < 0).reduce((s, t) => s + t.pnl_pct, 0) / losses : 0
  const bestTrade = trades.reduce<Trade|null>((b, t) => !b || t.pnl_pct > b.pnl_pct ? t : b, null)
  const worstTrade= trades.reduce<Trade|null>((b, t) => !b || t.pnl_pct < b.pnl_pct ? t : b, null)

  const fmt = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
  const fmtDate = (raw: string) => {
    const d = new Date(raw + 'Z')
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
      + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  const hearts = (n: number) => '♥'.repeat(n) + '♡'.repeat(5 - n)

  const filterParts: string[] = []
  if (filters.from)      filterParts.push(`С ${filters.from}`)
  if (filters.to)        filterParts.push(`По ${filters.to}`)
  if (filters.symbol)    filterParts.push(`Символ: ${filters.symbol}`)
  if (filters.direction) filterParts.push(filters.direction === 'long' ? 'Long' : 'Short')
  if (filters.result)    filterParts.push(filters.result.toUpperCase())

  const statsCards = [
    { label: 'Total P&L',  value: fmt(totalPnl),         color: totalPnl >= 0 ? '#10b981' : '#f97316' },
    { label: 'Трейдов',    value: String(trades.length),  color: '#0f172a' },
    { label: 'Win Rate',   value: winrate + '%',           color: winrate >= 50 ? '#10b981' : '#f97316' },
    { label: 'Avg Win',    value: '+' + avgWin.toFixed(2) + '%',  color: '#10b981' },
    { label: 'Avg Loss',   value: avgLoss.toFixed(2) + '%',       color: '#f97316' },
    { label: 'Best Trade', value: bestTrade ? fmt(bestTrade.pnl_pct) : '—', color: '#10b981' },
    { label: 'Worst Trade',value: worstTrade ? fmt(worstTrade.pnl_pct) : '—', color: '#f97316' },
  ]

  const rowsHtml = trades.map((t, i) => {
    const pnlClr = t.pnl_pct > 0 ? '#10b981' : t.pnl_pct < 0 ? '#f97316' : '#64748b'
    const dirClr = t.direction === 'long' ? '#10b981' : '#f97316'
    const resClr = t.result === 'take' ? '#10b981' : t.result === 'stop' ? '#f97316' : '#f59e0b'
    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc'
    const psych = t.psychology?.join(', ') || '—'
    const factors = t.factors?.map(f => f.name).join(', ') || '—'
    return `
      <tr style="background:${bg}">
        <td>${fmtDate(t.date)}</td>
        <td style="font-weight:700">${t.symbol}</td>
        <td style="color:${dirClr};font-weight:700">${t.direction.toUpperCase()}</td>
        <td>${t.session.replace('_', ' ')}</td>
        <td style="color:${resClr};font-weight:700">${t.result.toUpperCase()}</td>
        <td>${t.risk}%</td>
        <td>${t.rr}</td>
        <td style="color:${pnlClr};font-weight:700">${fmt(t.pnl_pct)}</td>
        <td>${hearts(t.rating)}</td>
        <td style="color:#6366f1;font-size:9.5px">${psych}</td>
        <td style="color:#3b82f6;font-size:9.5px">${factors}</td>
        <td style="color:#64748b;font-size:9.5px">${t.notes || '—'}</td>
      </tr>`
  }).join('')

  const now = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<title>Trading Journal — Экспорт</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f1f5f9; color: #0f172a; font-size: 11px; }

  .page { max-width: 1200px; margin: 0 auto; }

  /* Header */
  .header {
    background: linear-gradient(135deg, #1a1641 0%, #2d2480 100%);
    color: white; padding: 22px 32px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .header-title { font-family: 'Space Mono', monospace; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .header-sub { font-size: 11px; color: #b4b0dc; margin-top: 4px; }
  .header-right { text-align: right; }
  .header-date { font-size: 11px; color: #b4b0dc; }
  .header-filters { font-size: 10px; color: #8b87c8; margin-top: 4px; }

  /* Stats */
  .stats { display: flex; gap: 10px; padding: 18px 32px; background: #fff; border-bottom: 1px solid #e2e8f0; }
  .stat-card {
    flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 12px 14px; text-align: center;
  }
  .stat-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 6px; }
  .stat-value { font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 700; }

  /* Table */
  .table-wrap { padding: 18px 32px 32px; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  thead tr { background: #1a1641; }
  thead th {
    color: #c4bfee; font-size: 9px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.8px; padding: 10px 10px; text-align: left; white-space: nowrap;
  }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }

  /* Footer */
  .footer {
    background: #1a1641; color: #8b87c8; padding: 10px 32px;
    display: flex; justify-content: space-between; font-size: 9px;
  }

  /* Summary bar */
  .summary-bar {
    background: #f8fafc; border-top: 1px solid #e2e8f0;
    padding: 10px 32px; display: flex; gap: 24px;
    font-size: 10px; color: #64748b;
  }
  .summary-bar span b { font-family: 'Space Mono', monospace; }

  @media print {
    body { background: white; }
    @page { size: A4 landscape; margin: 0; }
    .page { max-width: 100%; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="header-title">Trading Journal — Экспорт</div>
      <div class="header-sub">${trades.length} трейдов · сформирован ${now}</div>
    </div>
    <div class="header-right">
      <div class="header-date">${now}</div>
      ${filterParts.length ? `<div class="header-filters">${filterParts.join(' · ')}</div>` : ''}
    </div>
  </div>

  <div class="stats">
    ${statsCards.map(c => `
      <div class="stat-card">
        <div class="stat-label">${c.label}</div>
        <div class="stat-value" style="color:${c.color}">${c.value}</div>
      </div>`).join('')}
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Дата</th><th>Символ</th><th>Dir</th><th>Сессия</th>
          <th>Рез.</th><th>Risk%</th><th>RR</th><th>PnL%</th>
          <th>Оценка</th><th>Психология</th><th>Факторы</th><th>Заметки</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>

  <div class="summary-bar">
    ${bestTrade  ? `<span>Лучший: <b style="color:#10b981">${bestTrade.symbol} ${fmt(bestTrade.pnl_pct)}</b></span>` : ''}
    ${worstTrade ? `<span>Худший: <b style="color:#f97316">${worstTrade.symbol} ${fmt(worstTrade.pnl_pct)}</b></span>` : ''}
    <span>Побед: <b>${wins}</b></span>
    <span>Поражений: <b>${losses}</b></span>
    <span>B/E: <b>${trades.length - wins - losses}</b></span>
  </div>

  <div class="footer">
    <span>Trading Journal</span>
    <span>Используй Ctrl+P → "Сохранить как PDF" · Ориентация: Альбомная</span>
  </div>

</div>
<script>
  // wait for Google Fonts to load, then print
  document.fonts.ready.then(() => setTimeout(() => window.print(), 400))
</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=1280,height=900')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Trades() {
  const navigate = useNavigate()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({ symbol: '', direction: '', result: '', rating: '', from: '', to: '' })
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)

  const apiFilters = useMemo(() => ({
    symbol:    filters.symbol    || undefined,
    direction: filters.direction || undefined,
    result:    filters.result    || undefined,
    rating:    filters.rating    ? Number(filters.rating)              : undefined,
    from:      filters.from      ? new Date(filters.from + 'T00:00:00').toISOString() : undefined,
    to:        filters.to        ? new Date(filters.to   + 'T23:59:59').toISOString() : undefined,
  }), [filters])

  const load = () => {
    setLoading(true)
    getTrades(apiFilters).then(setTrades).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [JSON.stringify(apiFilters)])

  const sorted = useMemo(() => [...trades].sort((a, b) => {
    let va: number | string = a[sortField] as number | string
    let vb: number | string = b[sortField] as number | string
    if (sortField === 'date') { va = new Date(va).getTime(); vb = new Date(vb).getTime() }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  }), [trades, sortField, sortDir])

  const handleSort = (f: SortField) => {
    sortField === f ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortField(f), setSortDir('desc'))
  }
  const handleDelete = async (id: number) => {
    await deleteTrade(id); setConfirmDelete(null); setTrades(prev => prev.filter(t => t.id !== id))
  }
  const setFilter = (k: keyof Filters, v: string) => setFilters(p => ({ ...p, [k]: v }))
  const hasFilters = Object.values(filters).some(Boolean)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const balanceStr = window.prompt("Enter Account Balance for PnL% calculation:", "100000")
    const balance = balanceStr ? parseFloat(balanceStr) : 100000
    setImporting(true)
    try {
      const res = await importHtml(file, balance || 100000)
      alert(`Successfully imported ${res.imported} trades!`)
      load()
    } catch (err: any) {
      alert("Failed to import: " + (err.response?.data?.detail || err.message))
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const totalPnl = trades.reduce((s, t) => s + t.pnl_pct, 0)
  const wins = trades.filter(t => t.pnl_pct > 0).length
  const winrate = trades.length ? (wins / trades.length * 100).toFixed(0) : '—'

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <th onClick={() => handleSort(field)}
      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: C.muted, cursor: 'pointer',
        textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, whiteSpace: 'nowrap', userSelect: 'none' }}>
      {label}{sortField === field && <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )
  const PlainTh = ({ label }: { label: string }) => (
    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: C.muted,
      textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{label}</th>
  )

  // quick-set shortcuts
  const setQuickRange = (preset: 'today' | 'week' | 'month') => {
    const now = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    if (preset === 'today') {
      setFilters(p => ({ ...p, from: fmt(now), to: fmt(now) }))
    } else if (preset === 'week') {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      setFilters(p => ({ ...p, from: fmt(mon), to: fmt(now) }))
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      setFilters(p => ({ ...p, from: fmt(start), to: fmt(now) }))
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700 }}>Trades</div>
          <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>
            {trades.length} trades{trades.length > 0 && ` · ${pnlFmt(totalPnl)} total · ${winrate}% WR`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* CSV */}
          <a href={getExportUrl(apiFilters)} download="trades_export.csv" style={{
            background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.item)}
            onMouseLeave={e => (e.currentTarget.style.background = C.card)}
          >
            ↓ CSV
          </a>

          {/* PDF */}
          <button onClick={() => exportPdf(sorted, filters)} style={{
            background: '#1a1641', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#231d5c')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1641')}
          >
            ↓ PDF
          </button>

          {/* Import */}
          <label style={{
            background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 16px', fontSize: 14, cursor: importing ? 'wait' : 'pointer', fontWeight: 600,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', opacity: importing ? 0.6 : 1,
          }}
            onMouseEnter={e => !importing && (e.currentTarget.style.background = C.item)}
            onMouseLeave={e => !importing && (e.currentTarget.style.background = C.card)}
          >
            {importing ? 'Importing...' : '↑ Import HTML'}
            <input type="file" accept=".html" onChange={handleImport} disabled={importing} style={{ display: 'none' }} />
          </label>

          <button onClick={() => navigate('/add')} style={{
            background: C.purpleBtn, color: '#ffffff', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.purple)}
            onMouseLeave={e => (e.currentTarget.style.background = C.purpleBtn)}
          >+ Add Trade</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
        {/* Row 1: text + selects */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <input type="text" placeholder="Symbol..." value={filters.symbol}
            onChange={e => setFilter('symbol', e.target.value.toUpperCase())}
            style={{ ...inputStyle, width: 110 }} />
          {(['direction', 'result', 'rating'] as const).map(key => (
            <select key={key} value={filters[key]} onChange={e => setFilter(key, e.target.value)} style={inputStyle}>
              {key === 'direction' && (<><option value="">All directions</option><option value="long">Long</option><option value="short">Short</option></>)}
              {key === 'result'    && (<><option value="">All results</option><option value="take">Take</option><option value="stop">Stop</option><option value="b/e">B/E</option></>)}
              {key === 'rating'    && (<><option value="">All ratings</option>{[5,4,3,2,1].map(r => <option key={r} value={r}>{'♥'.repeat(r)}</option>)}</>)}
            </select>
          ))}
        </div>

        {/* Row 2: date range */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Период:</span>
          <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)}
            style={{ ...inputStyle, fontSize: 13 }} />
          <span style={{ color: C.dim, fontSize: 13 }}>—</span>
          <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)}
            style={{ ...inputStyle, fontSize: 13 }} />

          {/* Quick presets */}
          {(['today', 'week', 'month'] as const).map(p => (
            <button key={p} onClick={() => setQuickRange(p)} style={{
              background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7,
              padding: '5px 12px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              transition: 'all 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.item; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
            >
              {p === 'today' ? 'Сегодня' : p === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}

          {hasFilters && (
            <button onClick={() => setFilters({ symbol: '', direction: '', result: '', rating: '', from: '', to: '' })}
              style={{ ...inputStyle, color: C.muted, cursor: 'pointer', fontSize: 13 }}>
              ✕ Сбросить
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: C.muted, fontSize: 15 }}>Loading...</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 15 }}>No trades found.</p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${C.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
                <Th field="date" label="Date" />
                <Th field="symbol" label="Symbol" />
                <PlainTh label="Dir" />
                <PlainTh label="Risk%" />
                <Th field="rr" label="RR" />
                <PlainTh label="Result" />
                <Th field="pnl_pct" label="PnL%" />
                <Th field="rating" label="Rating" />
                <PlainTh label="Type" />
                <PlainTh label="Psychology" />
                <PlainTh label="Factors" />
                <PlainTh label="Notes" />
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, idx) => (
                <tr key={t.id}
                  style={{ borderBottom: idx < sorted.length - 1 ? `1px solid rgba(0,0,0,0.04)` : 'none', background: C.card, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.item)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.card)}
                >
                  <td style={{ padding: '14px 16px', color: C.muted, fontSize: 15, whiteSpace: 'nowrap' }}>
                    {new Date(t.date + 'Z').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    <br /><span style={{ color: C.dim, fontSize: 13 }}>{new Date(t.date + 'Z').toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td style={{ padding: '14px 16px', ...mono, fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{t.symbol}</td>
                  <td style={{ padding: '14px 16px' }}><DirBadge dir={t.direction} /></td>
                  <td style={{ padding: '14px 16px', ...mono, fontSize: 15, color: C.text }}>{t.risk}%</td>
                  <td style={{ padding: '14px 16px', ...mono, fontSize: 15, color: C.text }}>{t.rr}</td>
                  <td style={{ padding: '14px 16px' }}><ResultBadge result={t.result} /></td>
                  <td style={{ padding: '14px 16px', ...mono, fontSize: 16, fontWeight: 700, color: pnlColor(t.pnl_pct), whiteSpace: 'nowrap' }}>{pnlFmt(t.pnl_pct)}</td>
                  <td style={{ padding: '14px 16px' }}><Hearts v={t.rating} /></td>
                  <td style={{ padding: '14px 16px' }}><TypeBadge type={t.trade_type} /></td>
                  <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                    <Tags items={t.psychology} color={C.purple} bg="rgba(124,115,255,0.1)" border="rgba(124,115,255,0.2)" />
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                    <Tags items={t.factors.map(f => f.name)} color={C.blue} bg="rgba(94,184,255,0.1)" border="rgba(94,184,255,0.2)" />
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                    {t.notes
                      ? <span style={{ fontSize: 14, color: C.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={t.notes}>{t.notes}</span>
                      : <span style={{ color: C.dim, fontSize: 14 }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    {confirmDelete === t.id ? (
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                        <span style={{ color: C.muted }}>Delete?</span>
                        <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 14, padding: 0, fontWeight: 600 }}>Yes</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: 0 }}>No</button>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 14 }}>
                        <button onClick={() => navigate(`/edit/${t.id}`)} style={{ background: 'none', border: 'none', color: C.purple, cursor: 'pointer', fontSize: 14, padding: 0 }}>Edit</button>
                        <button onClick={() => setConfirmDelete(t.id)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 14, padding: 0, opacity: 0.6 }}>Del</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

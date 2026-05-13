import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, FileText, Trash2, Pencil, Search, Upload } from 'lucide-react'
import { getTrades, deleteTrade, importHtml, importCsv, getExportUrl } from '../api/trades'
import { useSettings, fmtMoney } from '../contexts/SettingsContext'
import type { Trade } from '../types'

type SortField = 'date' | 'symbol' | 'pnl_pct' | 'rating' | 'rr'
type SortDir = 'asc' | 'desc'

interface Filters {
  symbol: string; direction: string; result: string; rating: string
  from: string; to: string
}

const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const resultLabel = (result: string) =>
  result === 'take' ? 'Take Profit' : result === 'stop' ? 'Stop Loss' : result === 'open' ? 'Open' : 'Break Even'
const resultShort = (result: string) =>
  result === 'take' ? 'Take' : result === 'stop' ? 'Stop' : result === 'open' ? 'Open' : 'B/E'
const resultBadgeClass = (result: string) =>
  result === 'take' ? 'bg-green-50 border-green-100 text-[#059669]'
    : result === 'stop' ? 'bg-red-50 border-red-100 text-[#DC2626]'
    : result === 'open' ? 'bg-blue-50 border-blue-100 text-[#2563EB]'
    : 'bg-amber-50 border-amber-100 text-[#D97706]'

/* ─── PDF export (browser print) ──────────────────────────────────────── */
function exportPdf(trades: Trade[], filters: Filters) {
  const totalPnl = trades.reduce((s, t) => s + t.pnl_pct, 0)
  const wins = trades.filter(t => t.pnl_pct > 0).length
  const losses = trades.filter(t => t.pnl_pct < 0).length
  const winrate = trades.length ? Math.round(wins / trades.length * 100) : 0
  const avgWin = wins ? trades.filter(t => t.pnl_pct > 0).reduce((s, t) => s + t.pnl_pct, 0) / wins : 0
  const avgLoss = losses ? trades.filter(t => t.pnl_pct < 0).reduce((s, t) => s + t.pnl_pct, 0) / losses : 0

  const fmtDate = (raw: string) => {
    const d = new Date(raw + 'Z')
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
      + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  const hearts = (n: number) => '♥'.repeat(n) + '♡'.repeat(5 - n)

  const filterParts: string[] = []
  if (filters.symbol) filterParts.push(`Symbol: ${filters.symbol}`)
  if (filters.direction) filterParts.push(`Direction: ${filters.direction}`)
  if (filters.result) filterParts.push(`Result: ${filters.result}`)
  if (filters.rating) filterParts.push(`Rating: ${filters.rating}+`)
  if (filters.from) filterParts.push(`From: ${filters.from}`)
  if (filters.to) filterParts.push(`To: ${filters.to}`)

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>tradestat — Trades Export</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; padding: 30px; color: #0F172A; background: white; font-size: 13px; }
    .header { background: #2563EB; color: white; padding: 24px; border-radius: 14px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.5px; }
    .header p { opacity: 0.85; font-size: 13px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; }
    .stat .lbl { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; font-weight: 600; }
    .stat .val { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; }
    .filters { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #1E40AF; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
    th { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px 8px; text-align: left; font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 10px 8px; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
    .mono { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
    .pos { color: #059669; } .neg { color: #DC2626; } .neu { color: #64748B; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
    @media print { body { padding: 15px; } }
  </style></head><body>
  <div class="header"><h1>tradestat</h1><p>Trade Export — ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
  <div class="stats">
    <div class="stat"><div class="lbl">Total Trades</div><div class="val">${trades.length}</div></div>
    <div class="stat"><div class="lbl">Win Rate</div><div class="val">${winrate}%</div></div>
    <div class="stat"><div class="lbl">Total PnL</div><div class="val ${totalPnl > 0 ? 'pos' : totalPnl < 0 ? 'neg' : 'neu'}">${fmt(totalPnl)}</div></div>
    <div class="stat"><div class="lbl">Avg Win / Loss</div><div class="val"><span class="pos">${fmt(avgWin)}</span> / <span class="neg">${fmt(avgLoss)}</span></div></div>
  </div>
  ${filterParts.length ? `<div class="filters"><b>Filters:</b> ${filterParts.join(' • ')}</div>` : ''}
  <table><thead><tr>
    <th>Date</th><th>Symbol</th><th>Dir</th><th>Result</th><th>Risk</th><th>RR</th><th>PnL</th><th>Rating</th><th>Session</th><th>Psychology</th><th>Factors</th>
  </tr></thead><tbody>
  ${trades.map(t => `<tr>
    <td>${fmtDate(t.date)}</td><td class="mono">${t.symbol}</td>
    <td>${t.direction === 'long' ? '▲ Long' : '▼ Short'}</td>
    <td>${resultShort(t.result)}</td>
    <td class="mono">${t.risk}%</td><td class="mono">1:${t.rr}</td>
    <td class="mono ${t.pnl_pct > 0 ? 'pos' : t.pnl_pct < 0 ? 'neg' : 'neu'}">${t.result === 'open' ? 'OPEN' : t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}</td>
    <td>${hearts(t.rating)}</td>
    <td>${t.session.replace('_', ' ')}</td>
    <td>${t.psychology.join(', ') || '—'}</td>
    <td>${t.factors.map(f => f.name).join(', ') || '—'}</td>
  </tr>`).join('')}
  </tbody></table>
  <div class="footer">tradestat • personal trading journal</div>
  </body></html>`

  const w = window.open('', '_blank', 'width=1280,height=900')
  if (!w) return
  w.document.write(html); w.document.close()
  w.addEventListener('load', () => setTimeout(() => w.print(), 400))
}

export default function Trades() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filters, setFilters] = useState<Filters>({ symbol: '', direction: '', result: '', rating: '', from: '', to: '' })

  const apiFilters = useMemo(() => {
    const f: { from?: string; to?: string } = {}
    if (filters.from) f.from = `${filters.from}T00:00:00`
    if (filters.to) f.to = `${filters.to}T23:59:59`
    return f
  }, [filters.from, filters.to])

  useEffect(() => {
    setLoading(true)
    getTrades(apiFilters).then(setTrades).finally(() => setLoading(false))
  }, [apiFilters])

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (filters.symbol && !t.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false
      if (filters.direction && t.direction !== filters.direction) return false
      if (filters.result && t.result !== filters.result) return false
      if (filters.rating && t.rating < Number(filters.rating)) return false
      return true
    })
  }, [trades, filters])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const va = a[sortField], vb = b[sortField]
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return arr
  }, [filtered, sortField, sortDir])

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('desc') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this trade?')) return
    await deleteTrade(id)
    setTrades(t => t.filter(x => x.id !== id))
  }

  const setQuickRange = (range: 'today' | 'thisWeek' | 'week' | 'thisMonth' | 'month' | 'all') => {
    const now = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    if (range === 'all') { setFilters(f => ({ ...f, from: '', to: '' })); return }
    if (range === 'today') { setFilters(f => ({ ...f, from: fmt(now), to: fmt(now) })); return }
    if (range === 'thisWeek') {
      const mon = new Date(now)
      mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      setFilters(f => ({ ...f, from: fmt(mon), to: fmt(sun) })); return
    }
    if (range === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7)
      setFilters(f => ({ ...f, from: fmt(start), to: fmt(now) })); return
    }
    if (range === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setFilters(f => ({ ...f, from: fmt(start), to: fmt(end) })); return
    }
    if (range === 'month') {
      const start = new Date(now); start.setMonth(now.getMonth() - 1)
      setFilters(f => ({ ...f, from: fmt(start), to: fmt(now) }))
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (/\.lnk$/i.test(file.name)) {
      alert('Это Windows shortcut (.lnk), а не файл отчёта. Открой папку с реальным CSV/HTML и выбери сам файл, не ярлык из Recent.')
      e.target.value = ''
      return
    }
    if (!/\.(csv|html?|htm)$/i.test(file.name)) {
      alert('Поддерживаются только CSV или HTML отчёты брокера.')
      e.target.value = ''
      return
    }
    const isCsv = /\.csv$/i.test(file.name)
    try {
      const res = isCsv ? await importCsv(file) : await importHtml(file)
      const trades = await getTrades(apiFilters)
      setTrades(trades)
      const skipped = (res as { skipped?: number }).skipped
      alert(`Импортировано: ${res.imported}${skipped ? ` • Пропущено (дубликаты): ${skipped}` : ''}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Ошибка импорта'
      alert(msg)
    } finally {
      e.target.value = ''
    }
  }

  const SortBtn = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <button onClick={() => toggleSort(field)} className={`inline-flex items-center gap-1 hover:text-[#0F172A] ${className}`}>
      {label} {sortField === field && <span className="text-[#2563EB]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Trade Log</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">{sorted.length} of {trades.length} trades</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="px-3 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-1.5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <Upload size={13} /> Import
            <input type="file" accept=".html,.htm,.csv,text/html,text/csv" onChange={handleImport} className="hidden" />
          </label>
          <a href={getExportUrl(apiFilters)} download="trades_export.csv"
            className="px-3 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <Download size={13} /> CSV
          </a>
          <button onClick={() => exportPdf(sorted, filters)} className="px-3 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <FileText size={13} /> PDF
          </button>
          <button onClick={() => navigate('/add')} className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <Plus size={13} strokeWidth={2.5} /> Log Trade
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden flex flex-col" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>

        {/* Filters Row */}
        <div className="p-3 border-b border-[#F1F5F9] flex flex-wrap gap-2 items-center bg-gray-50/50">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={filters.symbol} onChange={e => setFilters(f => ({ ...f, symbol: e.target.value }))}
              placeholder="Search symbol..." className="h-9 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-xs w-56 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-[#0F172A]" />
          </div>

          <select value={filters.direction} onChange={e => setFilters(f => ({ ...f, direction: e.target.value }))}
            className="h-9 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer">
            <option value="">All Directions</option><option value="long">Long</option><option value="short">Short</option>
          </select>

          <select value={filters.result} onChange={e => setFilters(f => ({ ...f, result: e.target.value }))}
            className="h-9 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer">
            <option value="">All Results</option><option value="open">Open</option><option value="take">Take</option><option value="stop">Stop</option><option value="b/e">B/E</option>
          </select>

          <select value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))}
            className="h-9 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer">
            <option value="">All Ratings</option><option value="5">5★</option><option value="4">4★+</option><option value="3">3★+</option>
          </select>

          <div className="flex items-center gap-1 ml-2">
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              className="h-9 px-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]" />
            <span className="text-[#94A3B8] text-xs">—</span>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              className="h-9 px-2 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]" />
          </div>

          <div className="flex gap-1 ml-2">
            {([
              { v: 'today',     l: 'Today' },
              { v: 'thisWeek',  l: 'This Week' },
              { v: 'week',      l: '7d' },
              { v: 'thisMonth', l: 'This Month' },
              { v: 'month',     l: '30d' },
              { v: 'all',       l: 'All' },
            ] as const).map(b => (
              <button key={b.v} onClick={() => setQuickRange(b.v)} className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider bg-white border border-[#E2E8F0] rounded-md hover:bg-gray-50 text-[#64748B] hover:text-[#0F172A] transition-colors">
                {b.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#64748B]">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">No trades found</div>
        ) : (
          <>
          <div className="space-y-3 p-3 md:hidden">
            {sorted.map(t => {
              const dt = new Date(t.date + 'Z')
              const isWin = t.pnl_pct > 0
              const isLoss = t.pnl_pct < 0
              const pnlClass = isWin ? 'text-[#059669]' : isLoss ? 'text-[#DC2626]' : 'text-[#64748B]'
              const resultClass = resultBadgeClass(t.result)
              return (
                <div key={t.id} onClick={() => navigate(`/trade/${t.id}`)}
                  className="rounded-2xl border border-[#F1F5F9] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#0F172A]">{t.symbol}</div>
                      <div className="mt-0.5 text-xs font-medium text-[#64748B]">
                        {dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} • {dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-lg font-bold ${pnlClass}`}>{t.result === 'open' ? 'OPEN' : t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}</div>
                      {settings && t.result !== 'b/e' && t.result !== 'open' && <div className={`font-mono text-xs ${pnlClass}`}>{fmtMoney(t.pnl_pct, settings.account_size, settings.currency)}</div>}
                    </div>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold capitalize text-gray-700">{t.direction}</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold capitalize text-gray-700">{t.session.replace('_', ' ')}</span>
                    <span className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${resultClass}`}>{resultShort(t.result)}</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700">{t.risk}% risk / 1:{t.rr}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                    <button onClick={e => { e.stopPropagation(); navigate(`/edit/${t.id}`) }} className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"><Pencil size={13} /> Edit</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(t.id) }} className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626]"><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead className="bg-white border-b border-[#F1F5F9]">
                <tr>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider"><SortBtn field="symbol" label="Asset & Time" /></th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Setup</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider"><SortBtn field="rr" label="Metrics (Risk / RR)" /></th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Context & Tags</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right"><SortBtn field="pnl_pct" label="Result PnL" className="ml-auto" /></th>
                  <th className="px-3 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(t => {
                  const dt = new Date(t.date + 'Z')
                  const dirColor = t.direction === 'long' ? 'text-[#059669]' : 'text-[#DC2626]'
                  const typeColor = !t.trade_type ? 'text-[#94A3B8]' : t.trade_type === 'trend' ? 'text-[#059669]' : 'text-[#D97706]'
                  const typeText = !t.trade_type ? '—' : t.trade_type === 'trend' ? 'Trend' : 'Counter'
                  const isWin = t.pnl_pct > 0
                  const isLoss = t.pnl_pct < 0
                  const resultClass = resultBadgeClass(t.result)
                  const resultText = resultLabel(t.result)
                  const pnlClass = isWin ? 'text-[#059669]' : isLoss ? 'text-[#DC2626]' : 'text-[#64748B]'
                  return (
                    <tr key={t.id} onClick={() => navigate(`/trade/${t.id}`)}
                      className="border-b border-[#F1F5F9]/60 hover:bg-gray-50/80 transition-colors cursor-pointer group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-[#0F172A]">{t.symbol.slice(0, 2)}</div>
                          <div>
                            <div className="font-bold text-sm text-[#0F172A]">{t.symbol}</div>
                            <div className="text-[11px] text-[#64748B] font-medium">
                              {dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} • {dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold ${dirColor}`}>{t.direction === 'long' ? 'Long' : 'Short'}</span>
                            <span className="text-gray-300">•</span>
                            <span className={`text-[11px] font-bold ${typeColor}`}>{typeText}</span>
                          </div>
                          <div className="text-[11px] font-medium text-[#64748B] capitalize">{t.session.replace('_', ' ')} Session</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-mono text-[#0F172A] font-medium">{t.risk}% <span className="text-[10px] text-[#64748B] font-sans ml-1 uppercase tracking-widest font-bold">Risk</span></div>
                          <div className="text-sm font-mono text-[#0F172A] font-medium">1:{t.rr} <span className="text-[10px] text-[#64748B] font-sans ml-1 uppercase tracking-widest font-bold">RR</span></div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {t.psychology.slice(0, 2).map(p => {
                            const isGood = p.toLowerCase().includes('систем')
                            const cls = isGood ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            return <span key={p} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>{p.split('/')[0].trim()}</span>
                          })}
                          {t.factors.slice(0, 2).map(f => (
                            <span key={f.id} className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-gray-100 text-gray-700 border-gray-200">{f.name}</span>
                          ))}
                          {(t.psychology.length + t.factors.length) > 4 && <span className="text-[11px] text-[#94A3B8]">+{t.psychology.length + t.factors.length - 4}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className={`font-mono text-lg font-bold ${pnlClass}`}>{t.result === 'open' ? 'OPEN' : t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}</div>
                          {settings && t.result !== 'b/e' && t.result !== 'open' && <div className={`font-mono text-[10px] ${pnlClass}`}>{fmtMoney(t.pnl_pct, settings.account_size, settings.currency)}</div>}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${resultClass}`}>{resultText}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); navigate(`/edit/${t.id}`) }} className="p-1.5 rounded-md hover:bg-blue-50 text-[#64748B] hover:text-[#2563EB] transition-colors"><Pencil size={14} /></button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(t.id) }} className="p-1.5 rounded-md hover:bg-red-50 text-[#64748B] hover:text-[#DC2626] transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  )
}

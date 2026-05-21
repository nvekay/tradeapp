import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, Search } from 'lucide-react'
import { getTrades, deleteTrade } from '../api/trades'
import { getBySymbol } from '../api/stats'
import { useSettings, fmtMoney } from '../contexts/SettingsContext'
import type { Trade, SymbolStat } from '../types'
import OpenPendingBadge from '../components/OpenPendingBadge'

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

export default function Backtests() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<SymbolStat[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filters, setFilters] = useState<Filters>({ symbol: '', direction: '', result: '', rating: '', from: '', to: '' })

  const apiFilters = useMemo(() => {
    const f: any = { is_backtest: 'true' }
    if (filters.from) f.from = `${filters.from}T00:00:00`
    if (filters.to) f.to = `${filters.to}T23:59:59`
    return f
  }, [filters.from, filters.to])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTrades(apiFilters),
      getBySymbol(apiFilters)
    ]).then(([t, s]) => {
      setTrades(t)
      setStats(s)
    }).finally(() => setLoading(false))
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
    if (!confirm('Delete this backtest trade?')) return
    await deleteTrade(id)
    setTrades(t => t.filter(x => x.id !== id))
  }

  const SortBtn = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <button onClick={() => toggleSort(field)} className={`inline-flex items-center gap-1 hover:text-[#0F172A] ${className}`}>
      {label} {sortField === field && <span className="text-[#2563EB]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )

  const activeStat = filters.symbol ? stats.find(s => s.symbol.toLowerCase() === filters.symbol.toLowerCase()) : null

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Backtests Journal</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">{sorted.length} backtest records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/backtests/new')} className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            <span className="text-base leading-none">⚡</span> Fast Entry
          </button>
        </div>
      </div>

      {activeStat && (
        <div className="mb-6 grid grid-cols-4 gap-4 p-5 bg-white border border-purple-100 rounded-2xl shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">Asset</div>
            <div className="text-xl font-bold text-[#0F172A]">{activeStat.symbol}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">Trades</div>
            <div className="text-xl font-bold text-[#0F172A]">{activeStat.total_trades}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">Winrate</div>
            <div className="text-xl font-bold text-[#0F172A]">{activeStat.winrate}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">Total PnL</div>
            <div className={`text-xl font-bold font-mono ${activeStat.total_pnl_pct > 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
              {activeStat.total_pnl_pct > 0 ? '+' : ''}{activeStat.total_pnl_pct.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden flex flex-col" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>

        {/* Filters Row */}
        <div className="p-3 border-b border-[#F1F5F9] flex flex-wrap gap-2 items-center bg-gray-50/50">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={filters.symbol} onChange={e => setFilters(f => ({ ...f, symbol: e.target.value }))}
              placeholder="Search symbol for stats..." className="h-9 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-xs w-56 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] text-[#0F172A]" />
          </div>

          <select value={filters.direction} onChange={e => setFilters(f => ({ ...f, direction: e.target.value }))}
            className="h-9 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer">
            <option value="">All Directions</option><option value="long">Long</option><option value="short">Short</option>
          </select>

          <select value={filters.result} onChange={e => setFilters(f => ({ ...f, result: e.target.value }))}
            className="h-9 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer">
            <option value="">All Results</option><option value="take">Take</option><option value="stop">Stop</option><option value="b/e">B/E</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#64748B]">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">No backtest trades found</div>
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
                <div key={t.id}
                  className="rounded-2xl border border-[#F1F5F9] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#0F172A]">{t.symbol}</div>
                      <div className="mt-0.5 text-xs font-medium text-[#64748B]">
                        {dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} • {dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-lg font-bold ${pnlClass}`}>{t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}</div>
                    </div>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold capitalize text-gray-700">{t.direction}</span>
                    <span className={`rounded-lg border px-2 py-1 text-[11px] font-bold ${resultClass}`}>{resultShort(t.result)}</span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700">{t.risk}% risk / 1:{t.rr}</span>
                  </div>
                  <div className="flex items-center justify-end border-t border-[#F1F5F9] pt-3">
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
                  const isWin = t.pnl_pct > 0
                  const isLoss = t.pnl_pct < 0
                  const resultClass = resultBadgeClass(t.result)
                  const resultText = resultLabel(t.result)
                  const pnlClass = isWin ? 'text-[#059669]' : isLoss ? 'text-[#DC2626]' : 'text-[#64748B]'
                  return (
                    <tr key={t.id} className="border-b border-[#F1F5F9]/60 hover:bg-gray-50/80 transition-colors group">
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
                          </div>
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
                          <div className={`font-mono text-lg font-bold ${pnlClass}`}>{t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}</div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${resultClass}`}>{resultText}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
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

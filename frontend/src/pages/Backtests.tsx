import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrade, getTrades, deleteTrade } from '../api/trades'
import { listStrategies } from '../api/strategies'
import { getSymbols, createSymbol, type UserSymbol } from '../api/symbols'
import { getFactors, createFactor } from '../api/factors'
import type { Strategy, Factor, Direction, TradeResult, TradeType, Trade } from '../types'
import SymbolSelect from '../components/SymbolSelect'
import TagSearchSelect from '../components/TagSearchSelect'
import { useSettings, fmtMoney } from '../contexts/SettingsContext'
import { Trash2 } from 'lucide-react'

const inputClass = "w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"
const mono = { fontFamily: "'Space Mono', monospace" }

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">{children}</label>
}

function Segmented<T>({ opts, value, onChange }: {
  opts: { v: T; label: React.ReactNode; activeBg: string; activeColor: string }[]
  value: T; onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden bg-white h-10">
      {opts.map((o, i) => {
        const active = value === o.v
        return (
          <button key={i} type="button" onClick={() => onChange(o.v)}
            className={`flex-1 flex items-center justify-center text-sm transition-colors ${i < opts.length - 1 ? 'border-r border-[#E2E8F0]' : ''} ${active ? 'font-bold' : 'text-[#64748B] hover:bg-gray-50 font-medium'}`}
            style={active ? { background: o.activeBg, color: o.activeColor } : {}}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export default function Backtests() {
  const { settings } = useSettings()
  
  // Form State
  const [symbol, setSymbol] = useState('GER40')
  const [direction, setDir] = useState<Direction>('long')
  const [risk, setRisk] = useState(1.0)
  const [rr, setRr] = useState(2.0)
  const [result, setResult] = useState<TradeResult>('take')
  const [tradeType, setTradeType] = useState<TradeType | null>(null)
  const [factorIds, setFids] = useState<number[]>([])
  const [strategyId, setStrategyId] = useState<number | null>(null)
  
  // App Data
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [symbolList, setSymbolList] = useState<UserSymbol[]>([])
  const [factorList, setFactorList] = useState<Factor[]>([])
  
  // Backtest Records
  const [backtests, setBacktests] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSub] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      listStrategies(), getSymbols(), getFactors(),
      getTrades({ is_backtest: 'true' } as any) // We will pass this to API
    ]).then(([s, syms, facs, trades]) => {
      setStrategies(s.filter(x => x.status === 'active'))
      setSymbolList(syms)
      setFactorList(facs)
      setBacktests(trades.filter(t => t.is_backtest))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSub(true)
    try {
      const payload = {
        symbol, direction, risk, rr, result,
        date: new Date().toISOString(), // Use current time, date doesn't matter for fast backtest
        session: 'london' as Session,   // Default filler
        factor_ids: factorIds,
        trade_type: tradeType || undefined,
        strategy_id: strategyId,
        is_backtest: true
      }
      const newTrade = await createTrade(payload)
      setBacktests([newTrade, ...backtests])
      
      // Reset only result-specific fields for rapid entry
      setResult('take')
    } catch (err) {
      alert("Failed to save backtest trade.")
    } finally {
      setSub(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteTrade(id)
    setBacktests(prev => prev.filter(t => t.id !== id))
  }

  const pnlPreview = result === 'take' ? risk * rr : result === 'stop' ? -risk : 0
  const pnlColor = pnlPreview > 0 ? '#059669' : pnlPreview < 0 ? '#DC2626' : '#64748B'
  const pnlBg = pnlPreview > 0 ? '#F0FDF4' : pnlPreview < 0 ? '#FEF2F2' : '#F8FAFC'
  const pnlBorder = pnlPreview > 0 ? '#BBF7D0' : pnlPreview < 0 ? '#FECACA' : '#E2E8F0'

  // Stats calculation
  const totalTrades = backtests.length
  const wins = backtests.filter(t => t.pnl_pct > 0).length
  const winrate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0
  const totalPnl = backtests.reduce((acc, t) => acc + t.pnl_pct, 0)
  
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Backtest Hub</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">Турбо-режим для быстрого ввода статистики тестов</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Fast Entry Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] p-5 sm:p-6 mb-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
              <span className="text-purple-600">⚡</span> Fast Entry Form
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <Label>Symbol</Label>
                <SymbolSelect
                  value={symbol} onChange={setSymbol} options={symbolList}
                  preferred={strategies.find(s => s.id === strategyId)?.allowed_symbols ?? []}
                  onCreate={async (n) => { const s = await createSymbol(n); setSymbolList(p => [...p, s]); return s }}
                />
              </div>
              <div>
                <Label>Strategy (Optional)</Label>
                <select value={strategyId ?? ''} onChange={e => setStrategyId(e.target.value ? Number(e.target.value) : null)} className={`${inputClass} cursor-pointer`}>
                  <option value="">— No strategy —</option>
                  {strategies.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <Label>Direction</Label>
                <Segmented value={direction} onChange={setDir} opts={[
                  { v: 'long', label: 'Long', activeBg: '#F0FDF4', activeColor: '#059669' },
                  { v: 'short', label: 'Short', activeBg: '#FEF2F2', activeColor: '#DC2626' },
                ]} />
              </div>
              <div>
                <Label>Risk %</Label>
                <input type="number" step="0.01" min="0.01" required value={risk} onChange={e => setRisk(Number(e.target.value))} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <Label>RR</Label>
                <input type="number" step="0.01" min="0.01" required value={rr} onChange={e => setRr(Number(e.target.value))} className={`${inputClass} font-mono`} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div className="sm:col-span-2">
                <Label>Result</Label>
                <Segmented value={result} onChange={setResult} opts={[
                  { v: 'take', label: 'Take', activeBg: '#F0FDF4', activeColor: '#059669' },
                  { v: 'stop', label: 'Stop', activeBg: '#FEF2F2', activeColor: '#DC2626' },
                  { v: 'b/e', label: 'B/E', activeBg: '#FFFBEB', activeColor: '#D97706' },
                ]} />
              </div>
              <div>
                <Label>PnL Preview</Label>
                <div className="w-full h-10 px-3 rounded-lg text-lg font-bold flex items-center justify-center font-mono border"
                  style={{ background: pnlBg, color: pnlColor, borderColor: pnlBorder }}>
                  {pnlPreview > 0 ? '+' : ''}{pnlPreview.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={submitting} className="w-full h-12 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 shadow-md">
                {submitting ? 'Saving...' : 'Save & Add Next'}
              </button>
            </div>
          </form>

          {/* Table of Backtest Trades */}
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#0F172A]">Recent Backtest Entries</h3>
              <span className="text-xs font-medium text-[#64748B]">{backtests.length} records</span>
            </div>
            {backtests.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#94A3B8]">No backtest records yet.</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-[#F8FAFC] sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Asset</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Dir</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Metrics</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">PnL</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtests.map(t => (
                      <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-sm text-[#0F172A]">{t.symbol}</td>
                        <td className={`px-4 py-3 text-xs font-bold ${t.direction === 'long' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{t.direction.toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-[#0F172A]">{t.risk}%</span> <span className="text-[#94A3B8] text-[10px]">R</span>
                          <span className="mx-1 text-[#E2E8F0]">|</span>
                          <span className="text-xs font-mono text-[#0F172A]">1:{t.rr}</span> <span className="text-[#94A3B8] text-[10px]">RR</span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${t.pnl_pct > 0 ? 'text-[#059669]' : t.pnl_pct < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                          {t.pnl_pct > 0 ? '+' : ''}{t.pnl_pct.toFixed(2)}%
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-md hover:bg-red-50 text-[#94A3B8] hover:text-[#DC2626] transition-colors"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Backtest Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#F1F5F9] p-5 shadow-sm sticky top-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Backtest Performance</h3>
            
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Total PnL</div>
                <div className={`font-mono text-3xl font-bold ${totalPnl > 0 ? 'text-[#059669]' : totalPnl < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                  {totalPnl > 0 ? '+' : ''}{totalPnl.toFixed(2)}%
                </div>
                {settings && <div className={`font-mono text-sm mt-1 font-semibold ${totalPnl > 0 ? 'text-[#059669]' : totalPnl < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>{fmtMoney(totalPnl, settings.account_size, settings.currency)}</div>}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F1F5F9]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Win Rate</div>
                  <div className="font-mono text-xl font-bold text-[#0F172A]">{winrate}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Total Trades</div>
                  <div className="font-mono text-xl font-bold text-[#0F172A]">{totalTrades}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBacktestTrade } from '../api/backtests'
import { listStrategies } from '../api/strategies'
import { getSymbols, createSymbol, type UserSymbol } from '../api/symbols'
import { getFactors, createFactor } from '../api/factors'
import { getPsychologyTags, createPsychologyTag } from '../api/psychology'
import type { Strategy, Factor, Direction, TradeResult, Session } from '../types'
import SymbolSelect from '../components/SymbolSelect'
import TagSearchSelect from '../components/TagSearchSelect'
import { ArrowLeft } from 'lucide-react'

const inputClass = "w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"

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

export default function BacktestEntry() {
  const navigate = useNavigate()
  
  // Form State
  const [symbol, setSymbol] = useState('GER40')
  const [direction, setDir] = useState<Direction>('long')
  const [risk, setRisk] = useState(1.0)
  const [rr, setRr] = useState(2.0)
  const [result, setResult] = useState<TradeResult>('take')
  const [strategyId, setStrategyId] = useState<number | null>(null)
  const [factorIds, setFids] = useState<number[]>([])
  const [psychology, setPsych] = useState<string[]>([])
  const [psyIds, setPsyIds] = useState<number[]>([])
  
  // App Data
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [symbolList, setSymbolList] = useState<UserSymbol[]>([])
  const [factorList, setFactorList] = useState<Factor[]>([])
  const [psyList, setPsyList] = useState<{ id: number; name: string }[]>([])
  
  const [submitting, setSub] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      listStrategies(), getSymbols(), getFactors(), getPsychologyTags()
    ]).then(([s, syms, facs, psy]) => {
      setStrategies(s.filter(x => x.status === 'active'))
      setSymbolList(syms)
      setFactorList(facs)
      setPsyList(psy)
    }).finally(() => {})
  }, [])

  useEffect(() => {
    if (!psyList.length || !psychology.length) { setPsyIds([]); return }
    const ids = psychology.map(name => psyList.find(t => t.name === name)?.id).filter((x): x is number => x !== undefined)
    setPsyIds(ids)
  }, [psyList, psychology])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSub(true)
    setSuccess(false)
    try {
      const payload = {
        symbol, direction, risk, rr, result,
        date: new Date().toISOString(), // Use current time
        session: 'london' as Session,   // Default filler
        factor_ids: factorIds,
        psychology: psychology,
        strategy_id: strategyId,
      }
      await createBacktestTrade(payload)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 1500)
      
      // Reset only result-specific fields for rapid entry
      setResult('take')
    } catch (err) {
      alert("Failed to save backtest trade.")
    } finally {
      setSub(false)
    }
  }

  const pnlPreview = result === 'take' ? risk * rr : result === 'stop' ? -risk : 0
  const pnlColor = pnlPreview > 0 ? '#059669' : pnlPreview < 0 ? '#DC2626' : '#64748B'
  const pnlBg = pnlPreview > 0 ? '#F0FDF4' : pnlPreview < 0 ? '#FEF2F2' : '#F8FAFC'
  const pnlBorder = pnlPreview > 0 ? '#BBF7D0' : pnlPreview < 0 ? '#FECACA' : '#E2E8F0'

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <button onClick={() => navigate('/backtests')} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#64748B] hover:text-[#0F172A]">
          <ArrowLeft size={14} /> Back to Backtests
        </button>
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Fast Backtest Entry</h2>
        <p className="text-sm font-medium text-[#64748B] mt-1">Турбо-режим для быстрого ввода статистики тестов</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] p-5 sm:p-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
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

        <div className="space-y-4 mb-6 pt-4 border-t border-[#F1F5F9]">
          <div>
            <Label>Psychology</Label>
            <TagSearchSelect
              options={psyList}
              value={psyIds}
              onChange={ids => {
                setPsyIds(ids)
                setPsych(ids.map(id => psyList.find(t => t.id === id)?.name).filter((x): x is string => !!x))
              }}
              onCreate={async (name) => {
                const t = await createPsychologyTag(name)
                setPsyList(prev => [...prev, t])
                return t
              }}
              placeholder="Select psychology tags..."
              emptyText="No tags yet"
            />
          </div>
          <div>
            <Label>Factors</Label>
            <TagSearchSelect
              options={factorList}
              value={factorIds}
              onChange={setFids}
              onCreate={async (name) => {
                const f = await createFactor(name)
                setFactorList(prev => [...prev, f])
                return f
              }}
              placeholder="Select factors..."
              emptyText="No factors yet"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-4">
          <button type="submit" disabled={submitting} className="flex-1 h-12 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 shadow-md">
            {submitting ? 'Saving...' : 'Save & Add Next'}
          </button>
          {success && <span className="text-sm font-semibold text-[#059669]">✓ Saved!</span>}
        </div>
      </form>
    </div>
  )
}

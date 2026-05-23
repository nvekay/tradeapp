import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getBacktestSession, getBacktestTrades, createBacktestTrade, deleteBacktestTrade, type BacktestSession, type BacktestTrade } from '../api/backtests'
import { getPsychologyTags, createPsychologyTag } from '../api/psychology'
import { getFactors, createFactor } from '../api/factors'
import type { Factor, Direction, TradeResult } from '../types'
import TagSearchSelect from '../components/TagSearchSelect'
import { ArrowLeft, Trash2 } from 'lucide-react'

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

export default function BacktestSessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [sessionInfo, setSessionInfo] = useState<BacktestSession | null>(null)
  const [trades, setTrades] = useState<BacktestTrade[]>([])
  
  // App Data
  const [factorList, setFactorList] = useState<Factor[]>([])
  const [psyList, setPsyList] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [direction, setDir] = useState<Direction>('long')
  const [risk, setRisk] = useState(1.0)
  const [rr, setRr] = useState(2.0)
  const [result, setResult] = useState<TradeResult>('take')
  const [factorIds, setFids] = useState<number[]>([])
  const [psychology, setPsych] = useState<string[]>([])
  const [psyIds, setPsyIds] = useState<number[]>([])
  const [submitting, setSub] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getBacktestSession(Number(id)),
      getBacktestTrades({ session_id: id }),
      getFactors(),
      getPsychologyTags()
    ]).then(([sess, tr, facs, psy]) => {
      setSessionInfo(sess)
      setTrades(tr)
      setFactorList(facs)
      setPsyList(psy)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!psyList.length || !psychology.length) { setPsyIds([]); return }
    const ids = psychology.map(name => psyList.find(t => t.name === name)?.id).filter((x): x is number => x !== undefined)
    setPsyIds(ids)
  }, [psyList, psychology])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionInfo) return
    setSub(true)
    try {
      const payload = {
        backtest_session_id: sessionInfo.id,
        direction, risk, rr, result,
        date: new Date().toISOString(), // Auto date
        session: 'london', // Default filler
        factor_ids: factorIds,
        psychology: psychology,
      }
      const newTrade = await createBacktestTrade(payload)
      setTrades([newTrade, ...trades])
      setResult('take') // reset just result for quick entry
    } catch (err) {
      alert("Failed to save backtest trade.")
    } finally {
      setSub(false)
    }
  }

  const handleDelete = async (tradeId: number) => {
    await deleteBacktestTrade(tradeId)
    setTrades(prev => prev.filter(t => t.id !== tradeId))
  }

  const pnlPreview = result === 'take' ? risk * rr : result === 'stop' ? -risk : 0
  const pnlColor = pnlPreview > 0 ? '#059669' : pnlPreview < 0 ? '#DC2626' : '#64748B'
  const pnlBg = pnlPreview > 0 ? '#F0FDF4' : pnlPreview < 0 ? '#FEF2F2' : '#F8FAFC'
  const pnlBorder = pnlPreview > 0 ? '#BBF7D0' : pnlPreview < 0 ? '#FECACA' : '#E2E8F0'

  if (loading) return <div className="p-12 text-center text-[#64748B]">Loading session...</div>
  if (!sessionInfo) return <div className="p-12 text-center text-[#DC2626]">Session not found</div>

  const totalTrades = trades.length
  const wins = trades.filter(t => t.pnl_pct > 0).length
  const winrate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0
  const totalPnl = trades.reduce((acc, t) => acc + t.pnl_pct, 0)

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <button onClick={() => navigate('/backtests')} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#64748B] hover:text-[#0F172A]">
          <ArrowLeft size={14} /> Back to Sessions
        </button>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{sessionInfo.name}</h2>
            <p className="text-sm font-medium text-[#64748B] mt-1">{sessionInfo.symbol} • {sessionInfo.start_date} to {sessionInfo.end_date}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Fast Entry Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] p-5 sm:p-6 mb-6 transition-all">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
              <span className="text-purple-600">⚡</span> Fast Entry Form
            </h3>
            
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

            <div className="space-y-4 mb-5 pt-4 border-t border-[#F1F5F9]">
              <div>
                <Label>Psychology / Mistakes</Label>
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
                <Label>Factors / Confluences</Label>
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

            <div className="pt-2">
              <button type="submit" disabled={submitting} className="w-full h-12 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-purple-600/20">
                {submitting ? 'Saving...' : 'Save & Add Next'}
              </button>
            </div>
          </form>

          {/* Table of Trades */}
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-[#0F172A]">Session Trades</h3>
              <span className="text-xs font-medium text-[#64748B]">{trades.length} records</span>
            </div>
            {trades.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#94A3B8]">No trades in this session yet.</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-[#F8FAFC] sticky top-0 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">No.</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Dir</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Metrics</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Tags</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">PnL</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, idx) => (
                      <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3 text-xs font-medium text-[#94A3B8]">#{trades.length - idx}</td>
                        <td className={`px-4 py-3 text-xs font-bold ${t.direction === 'long' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{t.direction.toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-[#0F172A]">{t.risk}%</span> <span className="text-[#94A3B8] text-[10px]">R</span>
                          <span className="mx-1 text-[#E2E8F0]">|</span>
                          <span className="text-xs font-mono text-[#0F172A]">1:{t.rr}</span> <span className="text-[#94A3B8] text-[10px]">RR</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {t.psychology?.map(p => <span key={p} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">{p}</span>)}
                            {t.factors?.map(f => <span key={f.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">{f.name}</span>)}
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${t.pnl_pct > 0 ? 'text-[#059669]' : t.pnl_pct < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                          {t.pnl_pct > 0 ? '+' : ''}{t.pnl_pct.toFixed(2)}%
                        </td>
                        <td className="px-3 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Right Col: Session Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#F1F5F9] p-5 shadow-sm sticky top-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Session Performance</h3>
            
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Total PnL</div>
                <div className={`font-mono text-4xl tracking-tight font-bold ${totalPnl > 0 ? 'text-[#059669]' : totalPnl < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                  {totalPnl > 0 ? '+' : ''}{totalPnl.toFixed(2)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F1F5F9]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Win Rate</div>
                  <div className="font-mono text-2xl font-bold text-[#0F172A]">{winrate}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Trades</div>
                  <div className="font-mono text-2xl font-bold text-[#0F172A]">{totalTrades}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

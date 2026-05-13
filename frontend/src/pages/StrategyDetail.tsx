import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { getStrategy, deleteStrategy } from '../api/strategies'
import { getTrades } from '../api/trades'
import type { Strategy, Trade } from '../types'
import { SESSION_LABELS } from '../constants'

const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
      <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">{label}</div>
      <div className="font-mono text-3xl font-bold tracking-tight" style={{ color: color || '#0F172A' }}>{value}</div>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-[#F1F5F9] last:border-b-0">
      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-[#0F172A] text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export default function StrategyDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    if (!id) return
    getStrategy(Number(id)).then(setStrategy)
    getTrades().then(all => setTrades(all.filter(t => t.strategy_id === Number(id))))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this strategy? Trades will be unlinked.')) return
    await deleteStrategy(Number(id))
    navigate('/strategies')
  }

  if (!strategy) return <div className="text-[#64748B]">Loading...</div>

  const pnlColor = strategy.total_pnl_pct > 0 ? '#059669' : strategy.total_pnl_pct < 0 ? '#DC2626' : '#0F172A'
  const profitFactor = (() => {
    const wins = trades.filter(t => t.pnl_pct > 0).reduce((s, t) => s + t.pnl_pct, 0)
    const losses = Math.abs(trades.filter(t => t.pnl_pct < 0).reduce((s, t) => s + t.pnl_pct, 0))
    return losses ? (wins / losses).toFixed(2) : '—'
  })()
  const expectancy = trades.length ? (trades.reduce((s, t) => s + t.pnl_pct, 0) / trades.length / strategy.max_risk_pct).toFixed(2) : '0.00'

  return (
    <div>
      <button onClick={() => navigate('/strategies')} className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] mb-4 transition-colors">
        <ArrowLeft size={14} /> All strategies
      </button>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{strategy.emoji || '🎯'}</div>
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{strategy.name}</h2>
            {strategy.description && <p className="text-sm text-[#64748B] mt-1 max-w-2xl">{strategy.description}</p>}
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                color: strategy.status === 'active' ? '#059669' : strategy.status === 'draft' ? '#D97706' : '#64748B',
                background: (strategy.status === 'active' ? '#059669' : strategy.status === 'draft' ? '#D97706' : '#64748B') + '15',
              }}>
              {strategy.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/strategies/${id}/edit`)}
            className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={handleDelete}
            className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#DC2626] text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
        <Stat label="Net P&L" value={fmt(strategy.total_pnl_pct)} color={pnlColor} />
        <Stat label="Win Rate" value={`${strategy.winrate.toFixed(0)}%`} />
        <Stat label="Profit Factor" value={profitFactor} />
        <Stat label="Expectancy (R)" value={expectancy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Rules */}
        <div className="bg-white p-6 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Rules & Conditions</h3>
          <RuleRow label="Allowed Directions" value={strategy.allowed_directions.length ? strategy.allowed_directions.join(', ') : '—'} />
          <RuleRow label="Trade Type" value={strategy.trade_type || 'Any'} />
          <RuleRow label="Sessions" value={strategy.allowed_sessions.length ? strategy.allowed_sessions.map(s => SESSION_LABELS[s]).join(', ') : '—'} />
          <RuleRow label="Instruments" value={strategy.allowed_symbols.length ? strategy.allowed_symbols.join(', ') : '—'} />
          <RuleRow label="Min RR" value={`1:${strategy.min_rr.toFixed(1)}`} />
          <RuleRow label="Max Risk" value={`${strategy.max_risk_pct}%`} />
          {strategy.sl_logic && <RuleRow label="SL Logic" value={strategy.sl_logic} />}
          {strategy.tp_logic && <RuleRow label="TP Logic" value={strategy.tp_logic} />}
        </div>

        {/* Checklist */}
        <div className="bg-white p-6 rounded-2xl border border-[#F1F5F9]" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Setup Checklist</h3>
          {strategy.setup_checklist.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No checklist items defined</p>
          ) : (
            <ul className="space-y-2">
              {strategy.setup_checklist.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#0F172A]">
                  <span className="text-[#2563EB] font-bold mt-0.5">✓</span> {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Trades */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <div className="p-5 border-b border-[#F1F5F9] flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#0F172A]">Trades using this strategy ({trades.length})</h3>
        </div>
        {trades.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">No trades linked yet</div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {trades.map(t => {
              const dt = new Date(t.date + 'Z')
              const c = t.pnl_pct > 0 ? '#059669' : t.pnl_pct < 0 ? '#DC2626' : '#64748B'
              return (
                <div key={t.id} onClick={() => navigate(`/edit/${t.id}`)}
                  className="flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-[#0F172A]">{t.symbol.slice(0,2)}</div>
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">{t.symbol}</div>
                      <div className="text-[11px] text-[#64748B] capitalize">{t.direction} • {dt.toLocaleDateString('ru-RU')}</div>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold" style={{ color: c }}>
                    {t.result === 'open' ? 'OPEN' : t.result === 'b/e' ? '0.00%' : fmt(t.pnl_pct)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

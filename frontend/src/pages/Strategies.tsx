import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Target } from 'lucide-react'
import { listStrategies } from '../api/strategies'
import type { Strategy, StrategyStatus } from '../types'

const fmtPnl = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
const statusDot = (s: StrategyStatus) => s === 'active' ? '#059669' : s === 'draft' ? '#D97706' : '#94A3B8'
const statusLabel = (s: StrategyStatus) => s === 'active' ? 'Active' : s === 'draft' ? 'Draft' : 'Archived'

export default function Strategies() {
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | StrategyStatus>('all')

  useEffect(() => {
    setLoading(true)
    listStrategies().then(setStrategies).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? strategies : strategies.filter(s => s.status === filter)
  const activeCount = strategies.filter(s => s.status === 'active').length
  const archivedCount = strategies.filter(s => s.status === 'archived').length

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Strategies</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">
            {activeCount} active • {archivedCount} archived
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-1" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
            {(['all', 'active', 'draft', 'archived'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${filter === f ? 'bg-gray-100 text-[#0F172A] font-semibold' : 'text-[#64748B] hover:text-[#0F172A] font-medium'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/strategies/new')}
            className="h-[34px] px-5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1.5"
            style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <Plus size={14} strokeWidth={2.5} /> New Strategy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[#64748B] text-base">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#F1F5F9] p-12 text-center" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <Target size={32} className="mx-auto mb-3 text-[#94A3B8]" strokeWidth={1.5} />
          <p className="text-base text-[#64748B] mb-4">No strategies yet</p>
          <button onClick={() => navigate('/strategies/new')} className="px-5 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Create your first strategy</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => {
            const pnlClass = s.total_pnl_pct > 0 ? 'text-[#059669]' : s.total_pnl_pct < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'
            return (
              <div key={s.id} onClick={() => navigate(`/strategies/${s.id}`)}
                className="bg-white p-5 rounded-2xl border border-[#F1F5F9] cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
                style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
                {/* Left status bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: statusDot(s.status) }} />

                <div className="flex justify-between items-start mb-3 ml-2">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{s.emoji || '🎯'}</div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] leading-tight">{s.name}</h3>
                      {s.description && <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{s.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {s.is_default && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">★ Default</span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: statusDot(s.status), background: statusDot(s.status) + '15' }}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 ml-2">
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <div className="font-mono text-base font-bold text-[#0F172A]">{s.total_trades}</div>
                    <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Trades</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <div className="font-mono text-base font-bold text-[#0F172A]">{s.winrate.toFixed(0)}%</div>
                    <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Win</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <div className={`font-mono text-base font-bold ${pnlClass}`}>{fmtPnl(s.total_pnl_pct)}</div>
                    <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">PnL</div>
                  </div>
                </div>

                <div className="text-xs text-[#94A3B8] mt-3 ml-2">
                  Avg RR: 1:{s.avg_rr.toFixed(1)} • Min RR: 1:{s.min_rr.toFixed(1)} • Risk: {s.max_risk_pct}%
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createStrategy, updateStrategy, getStrategy } from '../api/strategies'
import type { Direction, Session, TradeType, StrategyStatus } from '../types'
import { SYMBOLS, SESSION_LABELS } from '../constants'

const EMOJIS = ['🎯', '⚡', '🔥', '💎', '🌊', '🚀', '🎲', '⚓', '🛡️', '🔮']

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">{children}</label>
}

const inputClass = "w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"

export default function StrategyForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<StrategyStatus>('active')
  const [emoji, setEmoji] = useState('🎯')
  const [color, setColor] = useState('#2563EB')
  const [allowedDirections, setAllowedDirections] = useState<Direction[]>([])
  const [allowedSessions, setAllowedSessions] = useState<Session[]>([])
  const [allowedSymbols, setAllowedSymbols] = useState<string[]>([])
  const [tradeType, setTradeType] = useState<TradeType | null>(null)
  const [maxRiskPct, setMaxRiskPct] = useState(1.0)
  const [minRr, setMinRr] = useState(1.5)
  const [checklist, setChecklist] = useState<string[]>([])
  const [slLogic, setSlLogic] = useState('')
  const [tpLogic, setTpLogic] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getStrategy(Number(id)).then(s => {
      setName(s.name); setDescription(s.description || ''); setStatus(s.status)
      setEmoji(s.emoji || '🎯'); setColor(s.color || '#2563EB')
      setAllowedDirections(s.allowed_directions); setAllowedSessions(s.allowed_sessions); setAllowedSymbols(s.allowed_symbols)
      setTradeType(s.trade_type ?? null); setMaxRiskPct(s.max_risk_pct); setMinRr(s.min_rr)
      setChecklist(s.setup_checklist); setSlLogic(s.sl_logic || ''); setTpLogic(s.tp_logic || '')
      setIsDefault(s.is_default)
    })
  }, [id])

  const toggle = <T extends string>(list: T[], val: T) => list.includes(val) ? list.filter(x => x !== val) : [...list, val]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('')
    try {
      const payload = {
        name, description: description || undefined, status, emoji, color,
        allowed_directions: allowedDirections, allowed_sessions: allowedSessions, allowed_symbols: allowedSymbols,
        trade_type: tradeType, max_risk_pct: maxRiskPct, min_rr: minRr,
        setup_checklist: checklist.filter(c => c.trim()),
        sl_logic: slLogic || undefined, tp_logic: tpLogic || undefined,
        is_default: isDefault,
      }
      if (isEdit) await updateStrategy(Number(id), payload)
      else await createStrategy(payload)
      navigate('/strategies')
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{isEdit ? 'Edit Strategy' : 'New Strategy'}</h2>
        <p className="text-sm font-medium text-[#64748B] mt-1">Define rules and conditions for this setup</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#F1F5F9] p-8 space-y-6" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>

        {/* Identity */}
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-xl transition-all ${emoji === e ? 'bg-[#EFF6FF] ring-2 ring-[#2563EB] scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Name</Label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="London FVG Sweep" className={inputClass} />
            </div>
          </div>
          <div className="mt-4">
            <Label>Description</Label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Trend continuation on 5m after FVG mitigation..."
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none" />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]" />
              <span className="text-sm font-medium text-[#0F172A]">Set as default strategy</span>
              <span className="text-xs text-[#94A3B8]">— will be preselected when adding a new trade</span>
            </label>
          </div>

          <div className="mt-4">
            <Label>Status</Label>
            <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden bg-white h-10 max-w-md">
              {(['active', 'draft', 'archived'] as StrategyStatus[]).map((s, i, arr) => {
                const active = status === s
                const colors = { active: ['#F0FDF4', '#059669'], draft: ['#FFFBEB', '#D97706'], archived: ['#F1F5F9', '#64748B'] } as const
                const [bg, color] = colors[s]
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`flex-1 capitalize text-sm transition-colors ${i < arr.length - 1 ? 'border-r border-[#E2E8F0]' : ''} ${active ? 'font-bold' : 'text-[#64748B] hover:bg-gray-50 font-medium'}`}
                    style={active ? { background: bg, color } : {}}>{s}</button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Entry Rules */}
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Entry Rules</h3>

          <div className="space-y-4">
            <div>
              <Label>Allowed directions</Label>
              <div className="flex gap-2">
                {(['long', 'short'] as Direction[]).map(d => {
                  const active = allowedDirections.includes(d)
                  const color = d === 'long' ? '#059669' : '#DC2626'
                  const bg = d === 'long' ? '#F0FDF4' : '#FEF2F2'
                  return (
                    <button key={d} type="button" onClick={() => setAllowedDirections(toggle(allowedDirections, d))}
                      className={`px-4 py-2 rounded-lg text-sm border-2 capitalize transition-all ${active ? 'font-bold' : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 font-medium'}`}
                      style={active ? { background: bg, color, borderColor: color + '40' } : {}}>
                      {d === 'long' ? '▲ Long' : '▼ Short'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Trade type</Label>
              <div className="flex gap-2">
                {([null, 'trend', 'countertrend'] as (TradeType | null)[]).map(t => {
                  const active = tradeType === t
                  const label = t === null ? 'Any' : t === 'trend' ? '↗ Trend' : '↙ Counter'
                  return (
                    <button key={String(t)} type="button" onClick={() => setTradeType(t)}
                      className={`px-4 py-2 rounded-lg text-sm border-2 transition-all ${active ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold' : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 font-medium'}`}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Allowed sessions</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(SESSION_LABELS) as [Session, string][]).map(([v, l]) => {
                  const active = allowedSessions.includes(v)
                  return (
                    <button key={v} type="button" onClick={() => setAllowedSessions(toggle(allowedSessions, v))}
                      className={`px-3 py-1.5 rounded-lg text-xs border-2 transition-all ${active ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold' : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 font-medium'}`}>
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Allowed instruments</Label>
              <div className="flex flex-wrap gap-2">
                {SYMBOLS.map(s => {
                  const active = allowedSymbols.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => setAllowedSymbols(toggle(allowedSymbols, s))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border-2 transition-all ${active ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold' : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 font-medium'}`}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Setup checklist</Label>
              <div className="space-y-2">
                {checklist.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={c} onChange={e => setChecklist(checklist.map((x, j) => j === i ? e.target.value : x))}
                      placeholder="e.g. 4h OB present"
                      className={inputClass} />
                    <button type="button" onClick={() => setChecklist(checklist.filter((_, j) => j !== i))}
                      className="px-3 rounded-lg border border-[#E2E8F0] text-[#DC2626] hover:bg-red-50 text-sm">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setChecklist([...checklist, ''])}
                  className="text-xs font-semibold text-[#2563EB] hover:underline">+ Add condition</button>
              </div>
            </div>
          </div>
        </div>

        {/* Risk */}
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Risk Management</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Max risk per trade (%)</Label>
              <input type="number" step="0.1" min="0.1" value={maxRiskPct} onChange={e => setMaxRiskPct(Number(e.target.value))} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <Label>Min RR</Label>
              <input type="number" step="0.1" min="0.1" value={minRr} onChange={e => setMinRr(Number(e.target.value))} className={`${inputClass} font-mono`} />
            </div>
          </div>
        </div>

        {/* Exit Rules */}
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Exit Rules</h3>
          <div className="space-y-4">
            <div>
              <Label>Stop-loss logic</Label>
              <input value={slLogic} onChange={e => setSlLogic(e.target.value)} placeholder="Above/below the OB high/low" className={inputClass} />
            </div>
            <div>
              <Label>Take-profit logic</Label>
              <input value={tpLogic} onChange={e => setTpLogic(e.target.value)} placeholder="Fixed 1:2 RR / Trail behind 5m structure" className={inputClass} />
            </div>
          </div>
        </div>

        {error && <p className="text-[#DC2626] text-sm font-medium">{error}</p>}

        <div className="pt-4 flex gap-3 border-t border-[#F1F5F9]">
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Strategy'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

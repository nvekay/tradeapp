import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTrade, getTrade, updateTrade } from '../api/trades'
import { listStrategies } from '../api/strategies'
import type { Strategy } from '../types'
import type { Direction, TradeResult, Session, TradeType } from '../types'
import { SYMBOLS, SESSION_LABELS } from '../constants'
import HeartPicker from '../components/HeartPicker'
import TagSearchSelect from '../components/TagSearchSelect'
import ScreenshotInput from '../components/ScreenshotInput'
import { getFactors, createFactor } from '../api/factors'
import { getPsychologyTags, createPsychologyTag } from '../api/psychology'
import type { Factor } from '../types'

function toLocalInput(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function Label({ children, accent }: { children: React.ReactNode; accent?: 'error' }) {
  return <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${accent === 'error' ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>{children}</label>
}

const inputClass = "w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"

export default function AddTrade() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [symbol, setSymbol] = useState('GER40')
  const [direction, setDir] = useState<Direction>('long')
  const [risk, setRisk] = useState(1.0)
  const [rr, setRr] = useState(2.0)
  const [result, setResult] = useState<TradeResult>('take')
  const [date, setDate] = useState(() => toLocalInput(new Date()))
  const [session, setSession] = useState<Session>('london')
  const [notes, setNotes] = useState('')
  const [ss5m, setSs5m] = useState('')
  const [ss1h, setSs1h] = useState('')
  const [ss4h, setSs4h] = useState('')
  const [tradeType, setTradeType] = useState<TradeType | null>(null)
  const [psychology, setPsych] = useState<string[]>([])
  const [factorIds, setFids] = useState<number[]>([])
  const [rating, setRating] = useState(0)
  const [strategyId, setStrategyId] = useState<number | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [factorList, setFactorList] = useState<Factor[]>([])
  const [psyList, setPsyList] = useState<{ id: number; name: string }[]>([])
  const [psyIds, setPsyIds] = useState<number[]>([])
  const [submitting, setSub] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listStrategies().then(s => setStrategies(s.filter(x => x.status === 'active'))).catch(() => {})
    getFactors().then(setFactorList).catch(() => {})
    getPsychologyTags().then(setPsyList).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    getTrade(Number(id)).then(t => {
      setSymbol(t.symbol); setDir(t.direction); setRisk(t.risk); setRr(t.rr)
      setResult(t.result); setDate(toLocalInput(new Date(t.date + 'Z'))); setSession(t.session)
      setNotes(t.notes ?? ''); setSs5m(t.screenshot_5m ?? ''); setSs1h(t.screenshot_1h ?? ''); setSs4h(t.screenshot_4h ?? '')
      setPsych(t.psychology); setFids(t.factors.map(f => f.id)); setRating(t.rating)
      // psyIds will be hydrated by effect below once psyList is loaded
      setTradeType(t.trade_type)
      setStrategyId(t.strategy_id ?? null)
    })
  }, [id])

  // Sync psyIds from psychology strings + psyList; create missing tags lazily on save
  useEffect(() => {
    if (!psyList.length || !psychology.length) { setPsyIds([]); return }
    const ids = psychology.map(name => psyList.find(t => t.name === name)?.id).filter((x): x is number => x !== undefined)
    setPsyIds(ids)
  }, [psyList, psychology])

  const pnlPreview = useMemo(() => {
    if (result === 'take') return +(risk * rr).toFixed(4)
    if (result === 'stop') return -risk
    return 0
  }, [risk, rr, result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSub(true); setError('')
    try {
      const payload = {
        symbol, direction, risk, rr, result, date: new Date(date).toISOString(),
        session, notes: notes || undefined,
        screenshot_5m: ss5m || undefined, screenshot_1h: ss1h || undefined, screenshot_4h: ss4h || undefined,
        psychology, factor_ids: factorIds, rating, trade_type: tradeType || undefined,
        strategy_id: strategyId,
      }
      isEdit ? await updateTrade(Number(id), payload) : await createTrade(payload)
      navigate('/trades')
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error')
    } finally { setSub(false) }
  }

  /* ─── Segmented toggle ─────────────────────────────────────── */
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

  const pnlColor = pnlPreview > 0 ? '#059669' : pnlPreview < 0 ? '#DC2626' : '#64748B'
  const pnlBg = pnlPreview > 0 ? '#F0FDF4' : pnlPreview < 0 ? '#FEF2F2' : '#F8FAFC'
  const pnlBorder = pnlPreview > 0 ? '#BBF7D0' : pnlPreview < 0 ? '#FECACA' : '#E2E8F0'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{isEdit ? 'Edit Trade' : 'Новая сделка'}</h2>
        <p className="text-sm font-medium text-[#64748B] mt-1">Заполнение журнала параметров ордера</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#F1F5F9] p-8" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <div className="space-y-6">

          {/* Row 1: Symbol / Direction / Result */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Symbol</Label>
              <input list="symbols" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} required className={`${inputClass} font-bold`} />
              <datalist id="symbols">{SYMBOLS.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div>
              <Label>Direction</Label>
              <Segmented value={direction} onChange={setDir} opts={[
                { v: 'long' as Direction, label: <><span className="mr-1">▲</span> Long</>, activeBg: '#F0FDF4', activeColor: '#059669' },
                { v: 'short' as Direction, label: <><span className="mr-1">▼</span> Short</>, activeBg: '#FEF2F2', activeColor: '#DC2626' },
              ]} />
            </div>
            <div>
              <Label>Result</Label>
              <Segmented value={result} onChange={setResult} opts={[
                { v: 'take' as TradeResult, label: 'Take', activeBg: '#F0FDF4', activeColor: '#059669' },
                { v: 'stop' as TradeResult, label: 'Stop', activeBg: '#FEF2F2', activeColor: '#DC2626' },
                { v: 'b/e' as TradeResult, label: 'B/E', activeBg: '#FFFBEB', activeColor: '#D97706' },
              ]} />
            </div>
          </div>

          {/* Direction Type */}
          <div>
            <Label>Direction Type</Label>
            <Segmented value={tradeType} onChange={setTradeType} opts={[
              { v: null as TradeType | null, label: '—', activeBg: '#F1F5F9', activeColor: '#0F172A' },
              { v: 'trend' as TradeType, label: <><span className="mr-1">↗</span> Trend</>, activeBg: '#F0FDF4', activeColor: '#059669' },
              { v: 'countertrend' as TradeType, label: <><span className="mr-1">↙</span> Counter</>, activeBg: '#FFFBEB', activeColor: '#D97706' },
            ]} />
          </div>

          {/* Risk / RR / PnL Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Risk %</Label>
              <input type="number" step="0.1" min="0.1" required value={risk} onChange={e => setRisk(Number(e.target.value))} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <Label>RR</Label>
              <input type="number" step="0.1" min="0.1" required value={rr} onChange={e => setRr(Number(e.target.value))} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <Label>PnL Preview</Label>
              <div className="w-full h-10 px-3 rounded-lg text-lg font-bold flex items-center font-mono border"
                style={{ background: pnlBg, color: pnlColor, borderColor: pnlBorder }}>
                {pnlPreview > 0 ? '+' : ''}{pnlPreview}%
              </div>
            </div>
          </div>

          {/* Date / Session */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Date & Time</Label>
              <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label>Session</Label>
              <select value={session} onChange={e => setSession(e.target.value as Session)} className={`${inputClass} cursor-pointer`}>
                {Object.entries(SESSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <Label>Screenshots (TradingView URLs)</Label>
            <div className="flex flex-col gap-3">
              <ScreenshotInput label="5m" value={ss5m} onChange={setSs5m} />
              <ScreenshotInput label="1h" value={ss1h} onChange={setSs1h} />
              <ScreenshotInput label="4h" value={ss4h} onChange={setSs4h} />
            </div>
          </div>

          {/* Psychology / Factors */}
          <div className="space-y-4">
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
                emptyText="No psychology tags yet — type to create your first one"
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
                emptyText="No factors yet — type to create your first one"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label>Rating</Label>
            <HeartPicker value={rating} onChange={setRating} />
          </div>

          {/* Strategy */}
          <div>
            <Label>Strategy</Label>
            <select value={strategyId ?? ''} onChange={e => setStrategyId(e.target.value ? Number(e.target.value) : null)}
              className={`${inputClass} cursor-pointer`}>
              <option value="">— No strategy —</option>
              {strategies.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Trade notes..."
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none transition-all" />
          </div>

          {error && <p className="text-[#DC2626] text-sm font-medium">{error}</p>}

          {/* Actions */}
          <div className="pt-4 flex space-x-3 border-t border-[#F1F5F9]">
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Trade'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

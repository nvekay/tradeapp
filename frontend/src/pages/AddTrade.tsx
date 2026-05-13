import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createTrade, getTrade, getTrades, updateTrade } from '../api/trades'
import { listStrategies } from '../api/strategies'
import type { Strategy } from '../types'
import type { Direction, TradeResult, Session, TradeType } from '../types'
import { SESSION_LABELS } from '../constants'
import HeartPicker from '../components/HeartPicker'
import TagSearchSelect from '../components/TagSearchSelect'
import SymbolSelect from '../components/SymbolSelect'
import ScreenshotsField from '../components/ScreenshotsField'
import { getFactors, createFactor } from '../api/factors'
import { getPsychologyTags, createPsychologyTag } from '../api/psychology'
import { getSymbols, createSymbol } from '../api/symbols'
import type { UserSymbol } from '../api/symbols'
import type { Factor, Screenshot } from '../types'
import { fmtMoney, useSettings } from '../contexts/SettingsContext'
import { getTodayPnlPct } from '../components/DailyLossBanner'

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
  const [searchParams] = useSearchParams()
  const duplicateId = searchParams.get('duplicate')
  const dateParam = searchParams.get('date')
  const isEdit = Boolean(id)
  const { settings } = useSettings()

  const [symbol, setSymbol] = useState('GER40')
  const [direction, setDir] = useState<Direction>('long')
  const [risk, setRisk] = useState(1.0)
  const [rr, setRr] = useState(2.0)
  const [result, setResult] = useState<TradeResult>('take')
  const [date, setDate] = useState(() => dateParam ? `${dateParam}T12:00` : toLocalInput(new Date()))
  const [session, setSession] = useState<Session>('london')
  const [notes, setNotes] = useState('')
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [tradeType, setTradeType] = useState<TradeType | null>(null)
  const [psychology, setPsych] = useState<string[]>([])
  const [factorIds, setFids] = useState<number[]>([])
  const [rating, setRating] = useState(0)
  const [strategyId, setStrategyId] = useState<number | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [factorList, setFactorList] = useState<Factor[]>([])
  const [symbolList, setSymbolList] = useState<UserSymbol[]>([])
  const [psyList, setPsyList] = useState<{ id: number; name: string }[]>([])
  const [psyIds, setPsyIds] = useState<number[]>([])
  const [submitting, setSub] = useState(false)
  const [error, setError] = useState('')
  const [setupError, setSetupError] = useState('')
  const [todayPnl, setTodayPnl] = useState<number | null>(null)

  useEffect(() => {
    setSetupError('')
    listStrategies().then(s => {
      const active = s.filter(x => x.status === 'active')
      setStrategies(active)
      // Preselect default strategy only for new trades
      if (!id && !duplicateId) {
        const def = active.find(x => x.is_default)
        if (def) setStrategyId(def.id)
      }
    }).catch(() => setSetupError('Could not load strategies. You can still save the trade without a strategy.'))
    getFactors().then(setFactorList).catch(() => setSetupError('Could not load factors. Try refreshing before saving.'))
    getPsychologyTags().then(setPsyList).catch(() => setSetupError('Could not load psychology tags. Try refreshing before saving.'))
    getSymbols().then(setSymbolList).catch(() => setSetupError('Could not load symbols. Try refreshing before saving.'))
    if (!id) getTrades().then(ts => setTodayPnl(getTodayPnlPct(ts))).catch(() => {})
  }, [id, duplicateId])

  useEffect(() => {
    if (!id) return
    getTrade(Number(id)).then(t => {
      setSymbol(t.symbol); setDir(t.direction); setRisk(t.risk); setRr(t.rr)
      setResult(t.result); setDate(toLocalInput(new Date(t.date + 'Z'))); setSession(t.session)
      setNotes(t.notes ?? '')
      const ss = (t as { screenshots?: Screenshot[] }).screenshots
      if (ss && ss.length > 0) setScreenshots(ss)
      else {
        const legacy: Screenshot[] = []
        if (t.screenshot_5m) legacy.push({ label: '5m', url: t.screenshot_5m })
        if (t.screenshot_1h) legacy.push({ label: '1h', url: t.screenshot_1h })
        if (t.screenshot_4h) legacy.push({ label: '4h', url: t.screenshot_4h })
        setScreenshots(legacy)
      }
      setPsych(t.psychology); setFids(t.factors.map(f => f.id)); setRating(t.rating)
      // psyIds will be hydrated by effect below once psyList is loaded
      setTradeType(t.trade_type)
      setStrategyId(t.strategy_id ?? null)
    }).catch(() => setError('Trade not found or could not be loaded.'))
  }, [id])

  useEffect(() => {
    if (!duplicateId || id) return
    getTrade(Number(duplicateId)).then(t => {
      setSymbol(t.symbol); setDir(t.direction); setRisk(t.risk); setRr(t.rr)
      setResult(t.result); setDate(toLocalInput(new Date())); setSession(t.session)
      setNotes(''); setScreenshots([])
      setPsych(t.psychology); setFids(t.factors.map(f => f.id)); setRating(t.rating)
      setTradeType(t.trade_type)
      setStrategyId(t.strategy_id ?? null)
    }).catch(() => setError('Source trade for duplication was not found. Start from a blank trade or go back.'))
  }, [duplicateId, id])

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
    if (!isEdit && settings?.daily_loss_limit && todayPnl !== null && todayPnl <= settings.daily_loss_limit) {
      const proceed = window.confirm('Daily loss limit is already reached. Save this new trade anyway?')
      if (!proceed) { setSub(false); return }
    }
    try {
      const payload = {
        symbol, direction, risk, rr, result, date: new Date(date).toISOString(),
        session, notes: notes || undefined,
        screenshots,
        psychology, factor_ids: factorIds, rating, trade_type: tradeType || undefined,
        strategy_id: strategyId,
      }
      if (isEdit) await updateTrade(Number(id), payload)
      else await createTrade(payload)
      navigate('/trades')
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string | { msg?: string }[] } } })?.response?.data?.detail
      const message = Array.isArray(detail) ? detail.map(x => x.msg).join(', ') : detail
      setError(message || 'Could not save trade. Check the fields and try again.')
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

      {duplicateId && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
          Setup copied from a previous trade; date is set to now.
        </div>
      )}

      {setupError && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {setupError}
        </div>
      )}

      {!isEdit && settings?.daily_loss_limit && todayPnl !== null && todayPnl <= settings.daily_loss_limit && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="text-sm font-bold">Daily loss limit reached</div>
          <div className="mt-1 text-xs font-medium">
            Today you are at <span className="font-mono">{todayPnl.toFixed(2)}%</span> ({fmtMoney(todayPnl, settings.account_size, settings.currency)}).
            Limit is <span className="font-mono">{settings.daily_loss_limit.toFixed(2)}%</span>. This form stays available for corrections, but opening a new trade should be paused.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#F1F5F9] p-4 sm:p-8" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <div className="space-y-6">

          {/* Row 1: Symbol / Direction / Result */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Symbol</Label>
              <SymbolSelect
                value={symbol}
                onChange={setSymbol}
                options={symbolList}
                preferred={strategies.find(s => s.id === strategyId)?.allowed_symbols ?? []}
                onCreate={async (name) => {
                  const s = await createSymbol(name)
                  setSymbolList(prev => [...prev, s])
                  return s
                }}
              />
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
                { v: 'open' as TradeResult, label: 'Open', activeBg: '#EFF6FF', activeColor: '#2563EB' },
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
                {result === 'open' ? 'OPEN' : `${pnlPreview > 0 ? '+' : ''}${pnlPreview}%`}
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
            <ScreenshotsField value={screenshots} onChange={setScreenshots} />
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

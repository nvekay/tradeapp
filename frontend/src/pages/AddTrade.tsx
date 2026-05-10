import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTrade, getTrade, updateTrade } from '../api/trades'
import type { Direction, TradeResult, Session, TradeType } from '../types'
import { PSYCHOLOGY_OPTIONS, SYMBOLS, SESSION_LABELS } from '../constants'
import HeartPicker from '../components/HeartPicker'
import MultiSelect from '../components/MultiSelect'
import FactorSelect from '../components/FactorSelect'
import ScreenshotInput from '../components/ScreenshotInput'

function toLocalInput(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" }

const field: React.CSSProperties = {
  background: C.item, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none',
  width: '100%', fontFamily: 'inherit', transition: 'border-color 0.15s',
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{children}</div>
}

export default function AddTrade() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [symbol, setSymbol]  = useState('GER40')
  const [direction, setDir]  = useState<Direction>('long')
  const [risk, setRisk]      = useState(1.0)
  const [rr, setRr]          = useState(2.0)
  const [result, setResult]  = useState<TradeResult>('take')
  const [date, setDate]      = useState(() => toLocalInput(new Date()))
  const [session, setSession]= useState<Session>('london')
  const [notes, setNotes]    = useState('')
  const [ss5m, setSs5m]      = useState('')
  const [ss1h, setSs1h]      = useState('')
  const [ss4h, setSs4h]      = useState('')
  const [tradeType, setTradeType] = useState<TradeType | null>(null)
  const [psychology, setPsych] = useState<string[]>([])
  const [factorIds, setFids] = useState<number[]>([])
  const [rating, setRating]  = useState(0)
  const [submitting, setSub] = useState(false)
  const [error, setError]    = useState('')

  useEffect(() => {
    if (!id) return
    getTrade(Number(id)).then(t => {
      setSymbol(t.symbol); setDir(t.direction); setRisk(t.risk); setRr(t.rr)
      setResult(t.result); setDate(toLocalInput(new Date(t.date + 'Z'))); setSession(t.session)
      setNotes(t.notes ?? ''); setSs5m(t.screenshot_5m ?? ''); setSs1h(t.screenshot_1h ?? ''); setSs4h(t.screenshot_4h ?? '')
      setPsych(t.psychology); setFids(t.factors.map(f => f.id)); setRating(t.rating)
      setTradeType(t.trade_type)
    })
  }, [id])

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
      }
      isEdit ? await updateTrade(Number(id), payload) : await createTrade(payload)
      navigate('/trades')
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error')
    } finally { setSub(false) }
  }

  function Toggle<T extends string>({ opts, value, onChange }: {
    opts: { v: T; label: string; color: string; bg: string }[]
    value: T; onChange: (v: T) => void
  }) {
    return (
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        {opts.map(o => (
          <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{
            flex: 1, padding: '10px 6px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
            background: value === o.v ? o.bg : C.item,
            color: value === o.v ? o.color : C.muted,
            borderRight: `1px solid ${C.border}`,
          }}>{o.label}</button>
        ))}
      </div>
    )
  }

  const pnlColor = pnlPreview > 0 ? C.green : pnlPreview < 0 ? C.red : C.muted

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700, marginBottom: 28 }}>
        {isEdit ? 'Edit Trade' : 'Add Trade'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <Label>Symbol</Label>
            <input list="symbols" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} required style={field} />
            <datalist id="symbols">{SYMBOLS.map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <Label>Direction</Label>
            <Toggle value={direction} onChange={setDir} opts={[
              { v: 'long'  as Direction, label: '▲ Long',  color: C.green,  bg: 'rgba(61,255,160,0.15)' },
              { v: 'short' as Direction, label: '▼ Short', color: C.red,    bg: 'rgba(249,115,22,0.15)' },
            ]} />
          </div>
          <div>
            <Label>Result</Label>
            <Toggle value={result} onChange={setResult} opts={[
              { v: 'take' as TradeResult, label: 'Take', color: C.green,  bg: 'rgba(61,255,160,0.15)' },
              { v: 'stop' as TradeResult, label: 'Stop', color: C.red,    bg: 'rgba(249,115,22,0.15)' },
              { v: 'b/e'  as TradeResult, label: 'B/E',  color: C.yellow, bg: 'rgba(255,209,102,0.15)' },
            ]} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Label>Direction type</Label>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {([
              { v: null,            label: '—',            color: C.muted,   bg: C.item },
              { v: 'trend',         label: '↗ Trend',      color: C.green,   bg: 'rgba(61,255,160,0.15)' },
              { v: 'countertrend',  label: '↙ Counter',    color: C.yellow,  bg: 'rgba(255,209,102,0.15)' },
            ] as { v: TradeType | null; label: string; color: string; bg: string }[]).map(o => (
              <button key={String(o.v)} type="button" onClick={() => setTradeType(o.v)} style={{
                flex: 1, padding: '10px 6px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
                background: tradeType === o.v ? o.bg : C.item,
                color: tradeType === o.v ? o.color : C.muted,
                borderRight: `1px solid ${C.border}`,
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <Label>Risk %</Label>
            <input type="number" step="0.1" min="0.1" required value={risk} onChange={e => setRisk(Number(e.target.value))} style={field} />
          </div>
          <div>
            <Label>RR</Label>
            <input type="number" step="0.1" min="0.1" required value={rr} onChange={e => setRr(Number(e.target.value))} style={field} />
          </div>
          <div>
            <Label>PnL preview</Label>
            <div style={{ ...field, ...mono, fontSize: 20, fontWeight: 700, color: pnlColor, display: 'flex', alignItems: 'center' }}>
              {pnlPreview > 0 ? '+' : ''}{pnlPreview}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <Label>Date & Time</Label>
            <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} style={field} />
          </div>
          <div>
            <Label>Session</Label>
            <select value={session} onChange={e => setSession(e.target.value as Session)} style={field}>
              {Object.entries(SESSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Label>Screenshots (TradingView URLs)</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ScreenshotInput label="5m" value={ss5m} onChange={setSs5m} />
            <ScreenshotInput label="1h" value={ss1h} onChange={setSs1h} />
            <ScreenshotInput label="4h" value={ss4h} onChange={setSs4h} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Label>Psychology</Label>
          <MultiSelect options={PSYCHOLOGY_OPTIONS} value={psychology} onChange={setPsych} placeholder="Select psychology tags..." />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Label>Factors</Label>
          <FactorSelect value={factorIds} onChange={setFids} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Label>Rating</Label>
          <HeartPicker value={rating} onChange={setRating} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Label>Notes</Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Trade notes..." style={{ ...field, resize: 'none' }} />
        </div>

        {error && <p style={{ color: C.red, fontSize: 14, marginBottom: 14 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={submitting} style={{
            background: C.purpleBtn, color: '#ffffff', border: 'none', borderRadius: 8,
            padding: '11px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
            opacity: submitting ? 0.5 : 1,
          }}>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Trade'}</button>
          <button type="button" onClick={() => navigate(-1)} style={{
            background: 'rgba(0,0,0,0.04)', color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '11px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

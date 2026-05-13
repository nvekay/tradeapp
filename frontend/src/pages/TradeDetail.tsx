import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Edit3, ExternalLink, X } from 'lucide-react'
import { getTrade } from '../api/trades'
import { getJournal, type DailyJournal } from '../api/journal'
import { getStrategy } from '../api/strategies'
import { fmtMoney, useSettings } from '../contexts/SettingsContext'
import type { Screenshot, Strategy, Trade } from '../types'

function fmtPct(v: number) { return `${v > 0 ? '+' : ''}${v.toFixed(2)}%` }
function pnlClass(v: number) { return v > 0 ? 'text-[#059669]' : v < 0 ? 'text-[#DC2626]' : 'text-[#64748B]' }
function resultLabel(result: string) {
  if (result === 'b/e') return 'Break even'
  if (result === 'open') return 'Open'
  return result
}
function tradeDay(raw: string) {
  const d = new Date(raw + 'Z')
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function imageUrl(url: string) {
  const match = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i)
  if (!match) return url
  return `https://s3.tradingview.com/snapshots/${match[1][0].toLowerCase()}/${match[1]}.png`
}
function Chip({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'blue' | 'green' | 'red' }) {
  const cls = tone === 'blue' ? 'bg-blue-50 text-[#2563EB] border-blue-200'
    : tone === 'green' ? 'bg-green-50 text-green-700 border-green-200'
    : tone === 'red' ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-100 text-gray-700 border-gray-200'
  return <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${cls}`}>{children}</span>
}

export default function TradeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [journal, setJournal] = useState<DailyJournal | null>(null)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [lightbox, setLightbox] = useState<Screenshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    getTrade(Number(id)).then(async t => {
      setTrade(t)
      getJournal(tradeDay(t.date)).then(setJournal).catch(() => setJournal(null))
      if (t.strategy_id) getStrategy(t.strategy_id).then(setStrategy).catch(() => setStrategy(null))
    }).catch(() => setError('Trade not found or could not be loaded.'))
      .finally(() => setLoading(false))
  }, [id])

  const screenshots = useMemo(() => {
    if (!trade) return []
    if (trade.screenshots?.length) return trade.screenshots.filter(s => s.url)
    const legacy: Screenshot[] = []
    if (trade.screenshot_5m) legacy.push({ label: '5m', url: trade.screenshot_5m })
    if (trade.screenshot_1h) legacy.push({ label: '1h', url: trade.screenshot_1h })
    if (trade.screenshot_4h) legacy.push({ label: '4h', url: trade.screenshot_4h })
    return legacy
  }, [trade])

  if (loading) return <div className="text-[#64748B]">Loading trade...</div>
  if (error || !trade) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <div className="text-sm font-bold">Could not open trade</div>
        <p className="mt-1 text-sm">{error || 'Trade not found.'}</p>
        <button onClick={() => navigate('/trades')} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
          Back to trades
        </button>
      </div>
    )
  }

  const dt = new Date(trade.date + 'Z')
  const pnl = trade.result === 'b/e' || trade.result === 'open' ? 0 : trade.pnl_pct

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#64748B] hover:text-[#0F172A]">
            <ArrowLeft size={14} /> Back
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">{trade.symbol} trade</h2>
          <p className="mt-1 text-sm font-medium text-[#64748B]">
            {dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })} • {dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to={`/add?duplicate=${trade.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-gray-50">
            <Copy size={14} /> Duplicate
          </Link>
          <Link to={`/edit/${trade.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Edit3 size={14} /> Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-4">
              <div><div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Direction</div><div className="mt-1 text-lg font-bold capitalize">{trade.direction}</div></div>
              <div><div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Result</div><div className="mt-1 text-lg font-bold capitalize">{resultLabel(trade.result)}</div></div>
              <div><div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Risk / RR</div><div className="mt-1 font-mono text-lg font-bold">{trade.risk}% / 1:{trade.rr}</div></div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">P&L</div>
                <div className={`mt-1 font-mono text-2xl font-bold ${pnlClass(pnl)}`}>{trade.result === 'open' ? 'OPEN' : fmtPct(pnl)}</div>
                {settings && trade.result !== 'open' && <div className={`font-mono text-xs font-semibold ${pnlClass(pnl)}`}>{fmtMoney(pnl, settings.account_size, settings.currency)}</div>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#0F172A]">Tags and factors</h3>
            <div className="flex flex-wrap gap-2">
              <Chip tone="blue">{trade.session.replace('_', ' ')}</Chip>
              {trade.trade_type && <Chip>{trade.trade_type === 'trend' ? 'Trend' : 'Countertrend'}</Chip>}
              {trade.psychology.map(p => <Chip key={p} tone={p.toLowerCase().includes('систем') ? 'green' : 'red'}>{p}</Chip>)}
              {trade.factors.map(f => <Chip key={f.id} tone="blue">{f.name}</Chip>)}
              {trade.psychology.length === 0 && trade.factors.length === 0 && <span className="text-sm text-[#94A3B8]">No tags yet.</span>}
            </div>
          </div>

          <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#0F172A]">Screenshots</h3>
            {screenshots.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {screenshots.map(ss => (
                  <button key={`${ss.label}-${ss.url}`} type="button" onClick={() => setLightbox(ss)}
                    className="group overflow-hidden rounded-2xl border border-[#E2E8F0] bg-gray-50 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <img src={imageUrl(ss.url)} alt={ss.label || 'screenshot'} className="h-56 w-full object-cover" />
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{ss.label || 'Screenshot'}</span>
                      <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#2563EB]" />
                    </div>
                  </button>
                ))}
              </div>
            ) : <p className="text-sm text-[#94A3B8]">No screenshots attached.</p>}
          </div>

          {trade.notes && (
            <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-[#0F172A]">Notes</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#334155]">{trade.notes}</p>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-[#0F172A]">Strategy</h3>
            {strategy ? (
              <Link to={`/strategies/${strategy.id}`} className="block rounded-xl border border-[#E2E8F0] p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{strategy.emoji || '🎯'}</span>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">{strategy.name}</div>
                    <div className="text-xs text-[#64748B]">{strategy.total_trades} trades • {strategy.winrate.toFixed(0)}% win</div>
                  </div>
                </div>
              </Link>
            ) : <p className="text-sm text-[#94A3B8]">No linked strategy.</p>}
          </div>

          <div className="rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-[#0F172A]">Journal for this day</h3>
            {journal ? (
              <Link to={`/journal?date=${journal.date}`} className="block rounded-xl border border-[#E2E8F0] p-4 hover:bg-gray-50">
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{journal.date}</div>
                {journal.pre_plan && <p className="mt-2 line-clamp-4 text-sm text-[#334155]">{journal.pre_plan}</p>}
                {journal.post_learned && <p className="mt-2 line-clamp-4 text-sm text-[#334155]">{journal.post_learned}</p>}
              </Link>
            ) : (
              <Link to={`/journal?date=${tradeDay(trade.date)}`} className="text-sm font-semibold text-[#2563EB] hover:underline">Create journal entry</Link>
            )}
          </div>
        </aside>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightbox(null)}><X size={22} /></button>
          <img src={imageUrl(lightbox.url)} alt={lightbox.label || 'screenshot'} className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getJournal, createJournal, updateJournal, getJournalDates } from '../api/journal'
import type { DailyJournal } from '../api/journal'
import { getSummary } from '../api/stats'
import { getTrades } from '../api/trades'
import type { Trade } from '../types'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" }

const MOODS = [
  { val: 1, emoji: '😡', label: 'Ужасно' },
  { val: 2, emoji: '☹️', label: 'Плохо' },
  { val: 3, emoji: '😐', label: 'Нейтрально' },
  { val: 4, emoji: '🙂', label: 'Хорошо' },
  { val: 5, emoji: '🚀', label: 'Отлично' },
]

function MoodPicker({ value, onChange }: { value?: number | null, onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {MOODS.map(m => (
        <button
          key={m.val} type="button"
          onClick={() => onChange(m.val)}
          style={{
            fontSize: 24, padding: '4px 8px', borderRadius: 8, cursor: 'pointer', border: 'none',
            background: value === m.val ? 'rgba(99,102,241,0.15)' : 'transparent',
            filter: value === m.val || !value ? 'grayscale(0)' : 'grayscale(1)',
            transform: value === m.val ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.15s'
          }}
          title={m.label}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  )
}

export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  })
  const [journal, setJournal] = useState<DailyJournal | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // State fields
  const [preMood, setPreMood] = useState<number | null>(null)
  const [prePlan, setPrePlan] = useState('')
  const [postMood, setPostMood] = useState<number | null>(null)
  const [postLearned, setPostLearned] = useState('')

  const [dailyPnl, setDailyPnl] = useState<number | null>(null)
  const [dailyTrades, setDailyTrades] = useState(0)
  const [tradesList, setTradesList] = useState<Trade[]>([])
  const [allJournalDates, setAllJournalDates] = useState<string[]>([])

  // Sync URL param when date changes
  useEffect(() => {
    setSearchParams({ date }, { replace: true })
  }, [date])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  // Load journal dates for history list
  useEffect(() => {
    getJournalDates().then(dates => setAllJournalDates(dates)).catch(() => {})
  }, [saving]) // refresh after save

  useEffect(() => {
    setLoading(true)
    // Fetch journal
    getJournal(date).then(j => {
      setJournal(j)
      setPreMood(j.pre_mood || null)
      setPrePlan(j.pre_plan || '')
      setPostMood(j.post_mood || null)
      setPostLearned(j.post_learned || '')
    }).catch(() => {
      setJournal(null)
      setPreMood(null)
      setPrePlan('')
      setPostMood(null)
      setPostLearned('')
    }).finally(() => setLoading(false))
    
    // Fetch daily stats
    const start = new Date(date + 'T00:00:00Z')
    const end = new Date(date + 'T23:59:59Z')
    getSummary({ from: start.toISOString(), to: end.toISOString() })
      .then(s => {
        setDailyPnl(s.total_pnl_pct)
        setDailyTrades(s.total_trades)
      })
      .catch(() => {
        setDailyPnl(null)
        setDailyTrades(0)
      })

    getTrades({ from: start.toISOString(), to: end.toISOString() })
      .then(t => setTradesList(t))
      .catch(() => setTradesList([]))
  }, [date])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      pre_mood: preMood,
      pre_plan: prePlan || null,
      post_mood: postMood,
      post_learned: postLearned || null,
    }
    try {
      if (journal) {
        const updated = await updateJournal(date, payload)
        setJournal(updated)
      } else {
        const created = await createJournal({ date, ...payload })
        setJournal(created)
      }
      setToast({ msg: 'Дневник сохранён ✓', type: 'ok' })
    } catch {
      setToast({ msg: 'Ошибка при сохранении', type: 'err' })
    } finally {
      setSaving(false)
    }
  }

  const pnlColor = dailyPnl && dailyPnl > 0 ? C.green : dailyPnl && dailyPnl < 0 ? C.red : C.muted
  const pnlStr = dailyPnl ? `${dailyPnl > 0 ? '+' : ''}${dailyPnl.toFixed(2)}%` : '0.00%'

  const goDay = (delta: number) => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          background: toast.type === 'ok' ? C.green : C.red,
          color: '#fff', borderRadius: 10, padding: '12px 22px',
          fontSize: 15, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ ...mono, fontSize: 24, color: C.text, fontWeight: 700 }}>Дневник дня</div>
          <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>Связь эмоций и результатов</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => goDay(-1)} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            width: 38, height: 38, cursor: 'pointer', color: C.text, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 16px', fontSize: 15, color: C.text, outline: 'none',
              fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
            }}
          />
          <button onClick={() => goDay(1)} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            width: 38, height: 38, cursor: 'pointer', color: C.text, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px 220px', gap: 20 }}>
        {/* Left col: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>☀️</span>
              <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Pre-Market (До торгов)</h2>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Настроение</div>
              <MoodPicker value={preMood} onChange={setPreMood} />
            </div>
            
            <div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>План на день / Ожидания</div>
              <textarea 
                value={prePlan} onChange={e => setPrePlan(e.target.value)}
                placeholder="Что жду от рынка сегодня? Главный фокус..."
                style={{
                  width: '100%', background: C.item, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '12px 14px', fontSize: 14, color: C.text, outline: 'none',
                  fontFamily: 'inherit', resize: 'vertical', minHeight: 100
                }}
              />
            </div>
          </div>
          
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>🌙</span>
              <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Post-Market (После торгов)</h2>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Настроение</div>
              <MoodPicker value={postMood} onChange={setPostMood} />
            </div>
            
            <div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Итоги / Выводы</div>
              <textarea 
                value={postLearned} onChange={e => setPostLearned(e.target.value)}
                placeholder="Что пошло не так? Что понял нового?"
                style={{
                  width: '100%', background: C.item, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '12px 14px', fontSize: 14, color: C.text, outline: 'none',
                  fontFamily: 'inherit', resize: 'vertical', minHeight: 100
                }}
              />
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            style={{
              background: C.purpleBtn, color: '#fff', border: 'none', borderRadius: 8,
              padding: '14px', fontSize: 16, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить дневник'}
          </button>

        </div>

        {/* Middle col: Day Summary */}
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px', position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 16 }}>Итог за {new Date(date).toLocaleDateString('ru')}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Результат (PnL)</div>
                <div style={{ ...mono, fontSize: 32, fontWeight: 700, color: pnlColor }}>{pnlStr}</div>
              </div>
              
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Количество сделок</div>
                <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 600 }}>{dailyTrades}</div>
              </div>
            </div>

            {tradesList.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, fontWeight: 600 }}>Сделки за день:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tradesList.map(t => (
                    <Link key={t.id} to={`/edit/${t.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ 
                        background: C.item, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s' 
                      }} onMouseEnter={e => e.currentTarget.style.borderColor = C.purple} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                        <div>
                          <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.text }}>{t.symbol}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, textTransform: 'uppercase' }}>{t.direction}</div>
                        </div>
                        <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: t.pnl_pct > 0 ? C.green : t.pnl_pct < 0 ? C.red : C.muted }}>
                          {t.pnl_pct > 0 ? '+' : ''}{t.pnl_pct.toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right col: Journal History */}
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 18px', position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>История записей</div>
            {allJournalDates.length === 0 ? (
              <div style={{ fontSize: 13, color: C.dim }}>Нет записей</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
                {allJournalDates.map(d => {
                  const isActive = d === date
                  const [y, m, day] = d.split('-')
                  const label = `${day}.${m}.${y}`
                  return (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      style={{
                        background: isActive ? 'rgba(99,102,241,0.12)' : C.item,
                        border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : C.border}`,
                        borderRadius: 8, padding: '9px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s',
                      }}
                    >
                      <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: isActive ? C.purple : C.text }}>{label}</span>
                      <span style={{ fontSize: 16 }}>📝</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

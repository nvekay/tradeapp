import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBacktestSessions, deleteBacktestSession, createBacktestSession, type BacktestSession } from '../api/backtests'
import { listStrategies } from '../api/strategies'
import { getSymbols, createSymbol, type UserSymbol } from '../api/symbols'
import type { Strategy } from '../types'
import SymbolSelect from '../components/SymbolSelect'
import { Trash2, Plus, Calendar, Target, Activity } from 'lucide-react'

const inputClass = "w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-all"

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">{children}</label>
}

export default function Backtests() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<BacktestSession[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [symbolList, setSymbolList] = useState<UserSymbol[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('GER40')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [strategyId, setStrategyId] = useState<number | null>(null)
  const [submitting, setSub] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getBacktestSessions(),
      listStrategies(),
      getSymbols()
    ]).then(([sess, strats, syms]) => {
      setSessions(sess)
      setStrategies(strats.filter(s => s.status === 'active'))
      setSymbolList(syms)
    }).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSub(true)
    try {
      const s = await createBacktestSession({ name, symbol, start_date: startDate, end_date: endDate, strategy_id: strategyId })
      setSessions([s, ...sessions])
      setShowModal(false)
      setName('')
      setStartDate('')
      setEndDate('')
    } catch (err) {
      alert("Failed to create session")
    } finally {
      setSub(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this session and ALL its trades?')) return
    await deleteBacktestSession(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Backtest Sessions</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">Организуйте тесты по инструментам и датам</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm shadow-purple-600/20 active:scale-95">
          <Plus size={16} /> Создать сессию
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#64748B]">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#F1F5F9] shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
            <Activity size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] mb-2">У вас еще нет сессий бэктеста</h3>
          <p className="text-sm text-[#64748B] max-w-md mx-auto mb-6">
            Создайте свою первую сессию, чтобы начать быстро логировать сделки и собирать независимую статистику.
          </p>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-sm">
            Создать сессию
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map(s => {
            const st = strategies.find(x => x.id === s.strategy_id)
            return (
              <div key={s.id} onClick={() => navigate(`/backtests/${s.id}`)}
                className="bg-white rounded-2xl border border-[#F1F5F9] p-5 shadow-sm hover:shadow-md hover:border-purple-200 cursor-pointer transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-[#0F172A]">{s.symbol.slice(0, 2)}</div>
                    <div className="font-bold text-[#0F172A] text-lg">{s.name}</div>
                  </div>
                  <button onClick={e => handleDelete(e, s.id)} className="p-1.5 rounded-md text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-[#DC2626] hover:bg-red-50 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Target size={14} />
                    <span className="font-medium text-[#0F172A]">{s.symbol}</span>
                    {st && <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold">{st.name}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Calendar size={14} />
                    <span>{s.start_date} &rarr; {s.end_date}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-[#F1F5F9] flex justify-between items-center text-xs font-semibold text-purple-600">
                  <span>Открыть лабораторию</span>
                  <span>&rarr;</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold text-[#0F172A] mb-1">Новая сессия</h3>
            <p className="text-sm text-[#64748B] mb-6">Задайте параметры для нового бэктеста</p>
            
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <Label>Название сессии</Label>
                <input required type="text" placeholder="Например: Пробой Азии 2024" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label>Инструмент (Symbol)</Label>
                <SymbolSelect
                  value={symbol} onChange={setSymbol} options={symbolList}
                  preferred={[]}
                  onCreate={async (n) => { const s = await createSymbol(n); setSymbolList(p => [...p, s]); return s }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <Label>Привязка к Стратегии (Опционально)</Label>
                <select value={strategyId ?? ''} onChange={e => setStrategyId(e.target.value ? Number(e.target.value) : null)} className={`${inputClass} cursor-pointer`}>
                  <option value="">— Без стратегии —</option>
                  {strategies.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all">Отмена</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20">
                  {submitting ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

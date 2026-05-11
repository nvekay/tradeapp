import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { createSymbol } from '../api/symbols'
import { createStrategy } from '../api/strategies'

const SUGGESTED_SYMBOLS = [
  'GER40', 'US30', 'US500', 'NAS100', 'UK100',
  'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'USOIL',
  'BTCUSD', 'ETHUSD',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { update } = useSettings()
  const [step, setStep] = useState(1)
  const [accountSize, setAccountSize] = useState(10000)
  const [currency, setCurrency] = useState('USD')
  const [symbols, setSymbols] = useState<string[]>(['GER40', 'NAS100'])
  const [strategyName, setStrategyName] = useState('')
  const [strategyDescription, setStrategyDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleSymbol = (s: string) =>
    setSymbols(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const finish = async (withStrategy: boolean) => {
    setSaving(true)
    try {
      await update({ account_size: accountSize, currency, onboarding_completed: true })
      await Promise.all(symbols.map(name => createSymbol(name).catch(() => null)))
      if (withStrategy && strategyName.trim()) {
        await createStrategy({
          name: strategyName.trim(),
          description: strategyDescription || undefined,
          emoji: '🎯',
          status: 'active',
          is_default: true,
          allowed_symbols: symbols,
          max_risk_pct: 1,
          min_rr: 1.5,
        }).catch(() => null)
      }
      navigate('/app', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-8 text-[#0F172A]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-end justify-center gap-1 rounded-2xl bg-[#2563EB] pb-2 shadow-sm">
            <span className="h-3 w-1 rounded bg-white/70" />
            <span className="h-5 w-1 rounded bg-white" />
            <span className="h-4 w-1 rounded bg-white/80" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Set up your journal</h1>
          <p className="mt-2 text-sm font-medium text-[#64748B]">Three short steps before the first dashboard.</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= n ? 'bg-[#2563EB] text-white' : 'bg-white text-[#94A3B8] border border-[#E2E8F0]'}`}>
                {step > n ? <Check size={14} /> : n}
              </div>
              {n < 3 && <div className={`h-0.5 w-12 ${step > n ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-[#F1F5F9] bg-white p-6 shadow-sm sm:p-8">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold">Account size</h2>
              <p className="mt-1 text-sm text-[#64748B]">Used to display percentage P&L as money.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_140px]">
                <label>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Balance</span>
                  <input type="number" min="1" value={accountSize} onChange={e => setAccountSize(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 font-mono text-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
                </label>
                <label>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Currency</span>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm font-semibold focus:outline-none">
                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold">Trading instruments</h2>
              <p className="mt-1 text-sm text-[#64748B]">Pick what you trade most often. You can add more later.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SUGGESTED_SYMBOLS.map(s => {
                  const active = symbols.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSymbol(s)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${active ? 'border-blue-200 bg-blue-50 text-[#2563EB]' : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-gray-50'}`}>
                      {active ? '✓ ' : ''}{s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold">First strategy</h2>
              <p className="mt-1 text-sm text-[#64748B]">Optional, but it makes review and filtering useful from day one.</p>
              <div className="mt-6 space-y-4">
                <input value={strategyName} onChange={e => setStrategyName(e.target.value)}
                  placeholder="Example: London breakout"
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm font-medium focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
                <textarea value={strategyDescription} onChange={e => setStrategyDescription(e.target.value)}
                  placeholder="Entry rules, context, risk notes..."
                  className="h-24 w-full resize-none rounded-xl border border-[#E2E8F0] p-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#F1F5F9] pt-5 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => step === 1 ? finish(false) : setStep(s => s - 1)}
              className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-gray-50 disabled:opacity-50"
              disabled={saving}>
              {step === 1 ? 'Skip setup' : 'Back'}
            </button>
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Continue
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => finish(false)}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-gray-50 disabled:opacity-50"
                  disabled={saving}>
                  Skip strategy
                </button>
                <button type="button" onClick={() => finish(true)}
                  className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving || !strategyName.trim()}>
                  {saving ? 'Saving...' : 'Finish setup'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

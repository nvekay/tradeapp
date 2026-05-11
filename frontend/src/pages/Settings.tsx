import { useState, useEffect } from 'react'
import { Download, Save, AlertTriangle } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { exportAllUrl } from '../api/settings'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">{children}</label>
}

const inputClass = "w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"

export default function Settings() {
  const { settings, loading, update } = useSettings()
  const [accountSize, setAccountSize] = useState(0)
  const [currency, setCurrency] = useState('USD')
  const [dailyLoss, setDailyLoss] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setAccountSize(settings.account_size)
      setCurrency(settings.currency)
      setDailyLoss(settings.daily_loss_limit ?? '')
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await update({
        account_size: accountSize,
        currency,
        daily_loss_limit: dailyLoss === '' ? null : Number(dailyLoss),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const handleExport = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(exportAllUrl(), { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tradestat-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-[#64748B]">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Settings</h2>
        <p className="text-sm font-medium text-[#64748B] mt-1">Account, risk limits, data export</p>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] p-6 mb-5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Account size</Label>
            <input type="number" min="1" step="100" value={accountSize} onChange={e => setAccountSize(Number(e.target.value))}
              className={`${inputClass} font-mono`} />
            <p className="text-[11px] text-[#94A3B8] mt-1.5">Used to convert % PnL to {currency} amounts across the app</p>
          </div>
          <div>
            <Label>Currency</Label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="USD">USD — $</option>
              <option value="EUR">EUR — €</option>
              <option value="GBP">GBP — £</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] p-6 mb-5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#D97706]" /> Risk Guardrails
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Daily loss limit (%)</Label>
            <input type="number" step="0.1" placeholder="e.g. 3 (means -3%)" value={dailyLoss === '' ? '' : Math.abs(dailyLoss)}
              onChange={e => setDailyLoss(e.target.value === '' ? '' : -Math.abs(Number(e.target.value)))}
              className={`${inputClass} font-mono`} />
            <p className="text-[11px] text-[#94A3B8] mt-1.5">When today's loss reaches this %, a warning will show on Dashboard and AddTrade</p>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] p-6 mb-5" style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
        <h3 className="text-sm font-bold text-[#0F172A] mb-4 pb-2 border-b border-[#F1F5F9]">Data</h3>
        <button onClick={handleExport}
          className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
          <Download size={14} /> Export all data (JSON)
        </button>
        <p className="text-[11px] text-[#94A3B8] mt-2">Downloads a complete backup of your trades, strategies, journal, factors, psychology tags, and symbols</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
          <Save size={14} /> {saving ? 'Saving...' : 'Save settings'}
        </button>
        {saved && <span className="text-sm font-semibold text-[#059669]">✓ Saved</span>}
      </div>
    </div>
  )
}

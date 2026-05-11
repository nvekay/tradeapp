import { Plus, X, ImageIcon } from 'lucide-react'
import type { Screenshot } from '../types'

interface Props {
  value: Screenshot[]
  onChange: (v: Screenshot[]) => void
}

const PRESETS = ['5m', '15m', '1h', '4h', 'D']

export default function ScreenshotsField({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<Screenshot>) =>
    onChange(value.map((s, j) => j === i ? { ...s, ...patch } : s))
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i))
  const add = (label = '') => onChange([...value, { label, url: '' }])

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <div className="bg-gray-50/50 border border-dashed border-[#E2E8F0] rounded-lg p-6 text-center">
          <ImageIcon size={20} className="mx-auto mb-2 text-[#94A3B8]" strokeWidth={1.5} />
          <p className="text-xs text-[#94A3B8] mb-3">No screenshots yet</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {PRESETS.map(p => (
              <button key={p} type="button" onClick={() => add(p)}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E2E8F0] rounded-md hover:bg-blue-50 hover:border-[#2563EB] hover:text-[#2563EB] text-[#64748B] transition-colors">
                + {p}
              </button>
            ))}
            <button type="button" onClick={() => add('')}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#2563EB] text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1">
              <Plus size={10} strokeWidth={3} /> Custom
            </button>
          </div>
        </div>
      )}

      {value.map((ss, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={ss.label} onChange={e => update(i, { label: e.target.value })}
            placeholder="label"
            className="w-20 h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold uppercase tracking-wider text-center text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
          <input value={ss.url} onChange={e => update(i, { url: e.target.value })}
            placeholder="https://www.tradingview.com/x/..."
            className="flex-1 h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
          <button type="button" onClick={() => remove(i)}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:bg-red-50 hover:text-[#DC2626] hover:border-red-200 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESETS.filter(p => !value.some(v => v.label === p)).map(p => (
            <button key={p} type="button" onClick={() => add(p)}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E2E8F0] rounded-md hover:bg-blue-50 hover:border-[#2563EB] hover:text-[#2563EB] text-[#64748B] transition-colors">
              + {p}
            </button>
          ))}
          <button type="button" onClick={() => add('')}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E2E8F0] rounded-md hover:bg-blue-50 hover:border-[#2563EB] hover:text-[#2563EB] text-[#64748B] transition-colors flex items-center gap-1">
            <Plus size={10} strokeWidth={2.5} /> Custom
          </button>
        </div>
      )}
    </div>
  )
}

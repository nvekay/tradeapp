import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Plus, ChevronDown, Check } from 'lucide-react'
import type { UserSymbol } from '../api/symbols'

interface Props {
  value: string
  onChange: (v: string) => void
  options: UserSymbol[]
  preferred?: string[]   // shown at top under "From strategy"
  onCreate: (name: string) => Promise<UserSymbol>
}

export default function SymbolSelect({ value, onChange, options, preferred = [], onCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery('') } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const q = query.trim().toUpperCase()
  const filter = (s: string) => !q || s.toUpperCase().includes(q)
  const optNames = useMemo(() => options.map(o => o.name), [options])

  const preferredFiltered = preferred.filter(filter)
  const yourFiltered = optNames.filter(n => filter(n) && !preferred.includes(n))

  const allUpper = new Set(optNames.map(n => n.toUpperCase()).concat(preferred.map(p => p.toUpperCase())))
  const exactMatch = q && allUpper.has(q)

  const pick = (s: string) => { onChange(s); setOpen(false); setQuery('') }

  const handleCreate = async () => {
    const name = q
    if (!name || creating || exactMatch) return
    setCreating(true)
    try {
      await onCreate(name)
      pick(name)
    } finally { setCreating(false) }
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-left flex items-center justify-between cursor-pointer">
        <span className={value ? 'font-mono' : 'text-[#94A3B8] font-normal'}>{value || 'Select symbol...'}</span>
        <ChevronDown size={14} className="text-[#94A3B8]" />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)' }}>
          <div className="p-2 border-b border-[#F1F5F9] bg-gray-50/50">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (q && !exactMatch) handleCreate(); else if (preferredFiltered[0] || yourFiltered[0]) pick(preferredFiltered[0] || yourFiltered[0]) } }}
                placeholder="Search or create..."
                className="w-full h-9 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] uppercase" />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {q && !exactMatch && (
              <button type="button" onClick={handleCreate} disabled={creating}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50">
                <Plus size={14} strokeWidth={2.5} /> Create "<span className="font-mono">{q}</span>"
              </button>
            )}

            {preferredFiltered.length > 0 && (
              <div>
                <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider bg-blue-50/40">From strategy</div>
                {preferredFiltered.map(s => (
                  <button key={`pref-${s}`} type="button" onClick={() => pick(s)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-blue-50/30 transition-colors">
                    <span className="text-sm font-mono font-medium text-[#0F172A]">{s}</span>
                    {value === s && <Check size={14} className="text-[#2563EB]" />}
                  </button>
                ))}
              </div>
            )}

            {yourFiltered.length > 0 && (
              <div>
                {preferredFiltered.length > 0 && <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Your symbols</div>}
                {yourFiltered.map(s => (
                  <button key={s} type="button" onClick={() => pick(s)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-mono font-medium text-[#0F172A]">{s}</span>
                    {value === s && <Check size={14} className="text-[#2563EB]" />}
                  </button>
                ))}
              </div>
            )}

            {preferredFiltered.length === 0 && yourFiltered.length === 0 && !q && (
              <div className="px-4 py-6 text-center text-xs text-[#94A3B8]">No symbols yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

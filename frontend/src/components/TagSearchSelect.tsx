import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Plus, X } from 'lucide-react'

interface Option { id: number; name: string }

interface Props {
  options: Option[]
  value: number[]
  onChange: (ids: number[]) => void
  onCreate: (name: string) => Promise<Option>
  placeholder?: string
  emptyText?: string
}

export default function TagSearchSelect({ options, value, onChange, onCreate, placeholder = 'Select tags...', emptyText = 'No tags yet — start typing to create one' }: Props) {
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

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])

  const selected = useMemo(() => options.filter(o => value.includes(o.id)), [options, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.name.toLowerCase().includes(q))
  }, [options, query])

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q && options.some(o => o.name.toLowerCase() === q)
  }, [options, query])

  const handleCreate = async () => {
    const name = query.trim()
    if (!name || creating || exactMatch) return
    setCreating(true)
    try {
      const created = await onCreate(name)
      onChange([...value, created.id])
      setQuery('')
    } finally { setCreating(false) }
  }

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(true)}
        className="min-h-[40px] p-1.5 bg-white border border-[#E2E8F0] rounded-lg flex flex-wrap gap-1.5 items-center focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all cursor-text">
        {selected.length === 0 && (
          <span className="text-sm text-[#94A3B8] px-2">{placeholder}</span>
        )}
        {selected.map(o => (
          <span key={o.id} className="inline-flex items-center gap-1 px-2 py-1 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-md text-xs font-semibold">
            {o.name}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(o.id) }}
              className="hover:bg-[#2563EB]/10 rounded p-0.5 transition-colors">
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)' }}>
          <div className="p-2 border-b border-[#F1F5F9] bg-gray-50/50">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
                placeholder="Search or create..."
                className="w-full h-9 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {/* Create row at top when typing and no exact match */}
            {query.trim() && !exactMatch && (
              <button type="button" onClick={handleCreate} disabled={creating}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50">
                <Plus size={14} strokeWidth={2.5} /> Create "{query.trim()}"
              </button>
            )}

            {filtered.length === 0 && !query.trim() && (
              <div className="px-4 py-6 text-center text-xs text-[#94A3B8]">{emptyText}</div>
            )}

            {filtered.map(o => {
              const active = value.includes(o.id)
              return (
                <label key={o.id} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={active} onChange={() => toggle(o.id)}
                    className="w-4 h-4 accent-[#2563EB]" />
                  <span className={`text-sm ${active ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}`}>{o.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

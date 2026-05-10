import { useState, useRef, useEffect } from 'react'
import { getFactors, createFactor } from '../api/factors'
import type { Factor } from '../types'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" }

interface Props { value: number[]; onChange: (ids: number[]) => void }

export default function FactorSelect({ value, onChange }: Props) {
  const [factors, setFactors] = useState<Factor[]>([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { getFactors().then(setFactors) }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const f = await createFactor(name)
      setFactors(prev => [...prev, f])
      onChange([...value, f.id])
      setNewName('')
    } finally { setCreating(false) }
  }

  const selected = factors.filter(f => value.includes(f.id))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{
          minHeight: 44, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '6px 14px', background: C.item, border: `1px solid ${C.border}`,
          borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
      >
        {selected.length === 0
          ? <span style={{ fontSize: 14, color: C.muted }}>Select factors...</span>
          : selected.map(f => (
            <span key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              ...mono, fontSize: 12, padding: '3px 10px', borderRadius: 7,
              color: C.blue, background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.25)`,
            }}>
              {f.name}
              <button type="button" onClick={e => { e.stopPropagation(); toggle(f.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, lineHeight: 1, fontSize: 15 }}>
                ×
              </button>
            </span>
          ))
        }
      </div>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {factors.length === 0 && (
              <p style={{ fontSize: 14, color: C.muted, padding: '10px 16px' }}>No factors yet</p>
            )}
            {factors.map(f => (
              <label key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                cursor: 'pointer', fontSize: 14, color: value.includes(f.id) ? C.text : C.muted, transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <input type="checkbox" checked={value.includes(f.id)} onChange={() => toggle(f.id)}
                  style={{ accentColor: C.blue, width: 15, height: 15 }} />
                <span style={{ ...mono, fontSize: 12 }}>{f.name}</span>
              </label>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, padding: 10, display: 'flex', gap: 8 }}>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
              placeholder="New factor..."
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '7px 12px', fontSize: 13, color: C.text,
                outline: 'none', fontFamily: "'Space Mono', monospace",
              }}
            />
            <button type="button" onClick={handleCreate} disabled={!newName.trim() || creating}
              style={{
                background: 'rgba(59,130,246,0.15)', color: C.blue,
                border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 6,
                padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                opacity: (!newName.trim() || creating) ? 0.4 : 1,
              }}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}

interface Props {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}

export default function MultiSelect({ options, value, onChange, placeholder = 'Select...' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{
          minHeight: 44, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '6px 14px', background: C.item, border: `1px solid ${C.border}`,
          borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,132,255,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
      >
        {value.length === 0
          ? <span style={{ fontSize: 14, color: C.muted }}>{placeholder}</span>
          : value.map(v => (
            <span key={v} style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
              padding: '3px 10px', borderRadius: 20,
              color: C.purple, background: 'rgba(124,115,255,0.12)', border: `1px solid rgba(124,115,255,0.25)`,
            }}>
              {v}
              <button type="button" onClick={e => { e.stopPropagation(); toggle(v) }}
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
          maxHeight: 260, overflowY: 'auto',
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              cursor: 'pointer', fontSize: 14, color: value.includes(opt) ? '#0f172a' : C.muted,
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)}
                style={{ accentColor: C.purple, width: 15, height: 15 }} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

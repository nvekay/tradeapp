const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}

interface Props { label: string; value: string; onChange: (v: string) => void }

function tvUrlToImage(url: string): string | null {
  const match = url.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/i)
  if (!match) return null
  const hash = match[1]
  return `https://s3.tradingview.com/snapshots/${hash[0].toLowerCase()}/${hash}.png`
}

export default function ScreenshotInput({ label, value, onChange }: Props) {
  const imgUrl = value ? tvUrlToImage(value) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: C.muted, width: 26, flexShrink: 0 }}>{label}</span>
        <input type="url" value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://www.tradingview.com/x/..."
          style={{
            flex: 1, background: C.item, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 14px', fontSize: 14, color: '#0f172a', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(94,184,255,0.5)')}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
        {value && (
          <a href={value} target="_blank" rel="noopener noreferrer"
            style={{ color: C.blue, fontSize: 16, flexShrink: 0, textDecoration: 'none' }}>↗</a>
        )}
      </div>
      {imgUrl && (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginLeft: 36 }}>
          <img src={imgUrl} alt={`${label} chart`}
            style={{ borderRadius: 8, border: `1px solid ${C.border}`, maxHeight: 140, objectFit: 'cover', transition: 'border-color 0.15s' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(94,184,255,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
          />
        </a>
      )}
    </div>
  )
}

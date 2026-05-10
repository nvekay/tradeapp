interface Props { value: number; onChange: (v: number) => void }

export default function HeartPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(value === i ? 0 : i)}
          style={{ fontSize: 28, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer',
            color: i <= value ? '#f97316' : '#25284a', transition: 'transform 0.1s, color 0.15s', padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {i <= value ? '♥' : '♡'}
        </button>
      ))}
    </div>
  )
}

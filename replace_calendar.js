const fs = require('fs');
const path = require('path');

const filePath = path.resolve('C:/Users/куц/Desktop/journal/frontend/src/pages/Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const newPnlCalendar = `function PnlCalendar({ trades }: { trades: Trade[] }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0,0,0,0)
    return d
  })

  const byDate = useMemo(() => {
    const map: Record<string, { pnl: number, count: number }> = {}
    for (const t of trades) {
      const d = new Date(t.date + 'Z')
      const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0 }
      map[dateStr].pnl += t.pnl_pct
      map[dateStr].count += 1
    }
    return map
  }, [trades])

  const nextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
  }
  const prevMonth = () => {
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const startDay = firstDay === 0 ? 6 : firstDay - 1

  const cells = []
  for (let i = 0; i < startDay; i++) {
    cells.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i))
  }
  
  const totalCells = Math.ceil(cells.length / 7) * 7
  while (cells.length < totalCells) {
    cells.push(null)
  }

  const monthLabel = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ 
          background: C.item, border: \`1px solid \${C.border}\`, borderRadius: 8, 
          width: 38, height: 38, cursor: 'pointer', color: C.text, fontSize: 18, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ 
          background: C.item, border: \`1px solid \${C.border}\`, borderRadius: 8, 
          width: 38, height: 38, cursor: 'pointer', color: C.text, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>›</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 13, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>{d}</div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={\`empty-\${idx}\`} style={{ minHeight: 90, background: 'rgba(0,0,0,0.01)', borderRadius: 12, border: \`1px dashed \${C.border}\` }} />
          
          const dateStr = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0')
          const stat = byDate[dateStr]
          
          let bg = C.card
          let border = C.border
          let textColor = C.text
          
          if (stat) {
            if (stat.pnl > 0) {
              bg = 'rgba(16,185,129,0.1)'
              border = 'rgba(16,185,129,0.3)'
              textColor = C.green
            } else if (stat.pnl < 0) {
              bg = 'rgba(249,115,22,0.1)'
              border = 'rgba(249,115,22,0.3)'
              textColor = C.orange
            } else {
              bg = 'rgba(245,158,11,0.1)'
              border = 'rgba(245,158,11,0.3)'
              textColor = C.yellow
            }
          }
          
          return (
            <div key={dateStr} style={{
              minHeight: 90, borderRadius: 12, border: \`1px solid \${border}\`, background: bg,
              padding: '10px', display: 'flex', flexDirection: 'column', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 13, color: stat ? textColor : C.dim, fontWeight: 600, alignSelf: 'flex-end', opacity: stat ? 1 : 0.6 }}>{date.getDate()}</div>
              {stat ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: textColor }}>{stat.pnl > 0 ? '+' : ''}{stat.pnl.toFixed(2)}%</div>
                  <div style={{ fontSize: 12, color: textColor, opacity: 0.8, marginTop: 4, fontWeight: 500 }}>{stat.count} {stat.count === 1 ? 'trade' : 'trades'}</div>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}`;

const regex = /function PnlCalendar\(\{ trades \}: \{ trades: Trade\[\] \}\) \{[\s\S]*?return \([\s\S]*?\)\s*\n\}/;
content = content.replace(regex, newPnlCalendar);

fs.writeFileSync(filePath, content);
console.log("PnlCalendar replaced.");

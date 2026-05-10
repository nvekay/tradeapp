const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/куц/Desktop/journal/frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add getJournalCorrelation to imports
content = content.replace(
  "import { getSummary, getPnlCurve, getByPsychology, getByFactor } from '../api/stats'",
  "import { getSummary, getPnlCurve, getByPsychology, getByFactor, getJournalCorrelation } from '../api/stats'"
);

// 2. Add MoodStat to type imports
content = content.replace(
  "import type { StatsSummary, PnlPoint, Trade, TagStat, FactorStat } from '../types'",
  "import type { StatsSummary, PnlPoint, Trade, TagStat, FactorStat, MoodStat } from '../types'"
);

// 3. Add state
content = content.replace(
  "const [factorStats, setFactorStats] = useState<FactorStat[]>([])",
  "const [factorStats, setFactorStats] = useState<FactorStat[]>([])\n  const [moodStats, setMoodStats] = useState<MoodStat[]>([])"
);

// 4. Update Promise.all
content = content.replace(
  "Promise.all([getSummary(r), getPnlCurve(r), getTrades(r ? { from: range.from, to: range.to } : undefined), getByPsychology(r), getByFactor(r)])\n      .then(([s, c, t, ps, fs]) => {\n        setSummary(s); setCurve(c); setRecent(t.slice(0, 4))\n        setAllTrades(t); setPsychStats(ps); setFactorStats(fs)\n      })",
  "Promise.all([getSummary(r), getPnlCurve(r), getTrades(r ? { from: range.from, to: range.to } : undefined), getByPsychology(r), getByFactor(r), getJournalCorrelation(r)])\n      .then(([s, c, t, ps, fs, ms]) => {\n        setSummary(s); setCurve(c); setRecent(t.slice(0, 4))\n        setAllTrades(t); setPsychStats(ps); setFactorStats(fs); setMoodStats(ms)\n      })"
);

// 5. Add mood to psychology block
const moodBlock = `
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Корреляция Эмоции ↔ Результат</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {moodStats.length > 0 ? moodStats.map(m => (
                <div key={m.mood} style={{ background: C.item, border: \`1px solid \${C.border}\`, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{['😡','☹️','😐','🙂','🚀'][m.mood - 1]}</div>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: m.avg_pnl_pct > 0 ? C.green : m.avg_pnl_pct < 0 ? C.orange : C.text }}>{m.avg_pnl_pct > 0 ? '+' : ''}{m.avg_pnl_pct.toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{m.total_trades} {m.total_trades === 1 ? 'trade' : 'trades'}</div>
                </div>
              )) : <div style={{ fontSize: 13, color: C.dim, gridColumn: 'span 5' }}>Нет записей в дневнике за период</div>}
            </div>
          </div>
`;

content = content.replace(
  /<\/div>\s*<\/Card>\s*<Card title="By session">/,
  moodBlock + "\n        </Card>\n\n        <Card title=\"By session\">"
);

fs.writeFileSync(filePath, content);
console.log("Dashboard updated with mood correlation");
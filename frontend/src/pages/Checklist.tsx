import { useState } from 'react'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" }

interface CheckItem { id: string; label: string; sub?: string }
interface Section { id: string; title: string; icon: string; items: CheckItem[] }

const SECTIONS: Section[] = [
  {
    id: 'day', title: 'Фильтры дня', icon: '📅',
    items: [
      { id: 'd1', label: 'Сегодня не полностью красный день по новостям USD' },
      { id: 'd3', label: 'Просадка за текущую неделю не превышает 4%' },
      { id: 'd4', label: 'За сегодняшнюю сессию не было ещё 2 стоп-лосса и не было 1 тейк-профита' },
    ],
  },
  {
    id: 'time', title: 'Торговое время', icon: '⏰',
    items: [
      { id: 't1', label: 'Время входа — открытие Лондонской сессии', sub: 'Летнее: 10:00–12:00 МСК · Зимнее: 11:00–13:00 МСК' },
      { id: 't2', label: 'NY-сессию не торгую' },
    ],
  },
  {
    id: 'ctx', title: 'Контекст (топ-вниз анализ)', icon: '📈',
    items: [
      { id: 'c1', label: 'На 1D определил направление дня (бычье / медвежье)' },
      { id: 'c2', label: 'На 4H определил среднесрочный контекст и актуальный POI 4H' },
      { id: 'c3', label: 'На 1H определил краткосрочный OF (Order Flow)' },
      { id: 'c4', label: 'OF на 1H совпадает с направлением на 4H и 1D' },
      { id: 'c5', label: 'Цена находится вблизи POI 4H или POI 1H', sub: 'обязательно наличие хотя бы обоих ТФ вместе' },
    ],
  },
  {
    id: 'entry-base', title: 'Точка входа', icon: '🎯',
    items: [
      { id: 'e1', label: 'Вхожу от POI краткосрочного ТФ (1H)' },
      { id: 'e2', label: 'На M15/M5 подтверждён вход' },
    ],
  },
  {
    id: 'risk', title: 'Риск-менеджмент', icon: '🛡️',
    items: [
      { id: 'r1', label: 'Риск на сделку — 1% от депозита' },
      { id: 'r3', label: 'Тейк-профит определён заранее' },
    ],
  },
]

const VARIANT_A: CheckItem[] = [
  { id: 'a1', label: 'Произошёл ресвип уровня' },
  { id: 'a2', label: 'Сформировался OB (Order Block)' },
  { id: 'a3', label: 'Свеча(и) без фитилей' },
]

const VARIANT_B: CheckItem[] = [
  { id: 'b1', label: 'Сформировался OB (Order Block)' },
  { id: 'b2', label: 'Сформировался IFVG' },
  { id: 'b3', label: 'Свеча(и) без фитилей' },
]

export default function Checklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [variant, setVariant] = useState<'A' | 'B' | null>(null)

  const toggle = (id: string) =>
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const variantItems = variant === 'A' ? VARIANT_A : variant === 'B' ? VARIANT_B : []
  const allRequired = [...SECTIONS.flatMap(s => s.items), ...variantItems]
  const needVariant = variant === null
  const totalCount = allRequired.length + (needVariant ? 1 : 0)
  const doneCount = allRequired.filter(i => checked.has(i.id)).length
  const allDone = !needVariant && doneCount === allRequired.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const reset = () => { setChecked(new Set()); setVariant(null) }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700 }}>Чеклист перед входом</div>
          <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>Все пункты должны быть отмечены</div>
        </div>
        <button onClick={reset} style={{
          background: 'rgba(0,0,0,0.04)', color: C.muted,
          border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '8px 18px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
        }}>Сбросить</button>
      </div>

      {/* Progress bar */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: C.muted }}>Прогресс</span>
          <span style={{ ...mono, fontSize: 16, fontWeight: 700, color: allDone ? C.green : C.text }}>{doneCount} / {totalCount}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s',
            width: `${pct}%`,
            background: allDone ? C.green : pct > 60 ? C.yellow : C.purple,
          }} />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <SectionBlock key={section.id} section={section} checked={checked} onToggle={toggle} />
      ))}

      {/* Variant picker */}
      <div style={{ background: C.card, border: `1px solid ${variant ? 'rgba(124,115,255,0.35)' : C.border}`, borderRadius: 14, padding: '20px 22px', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 14, fontWeight: 600 }}>Выбери вариант входа</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: variant ? 18 : 0 }}>
          {(['A', 'B'] as const).map(v => (
            <button key={v} onClick={() => setVariant(v)} style={{
              padding: '12px 16px', borderRadius: 10, border: `1px solid ${variant === v ? 'rgba(124,115,255,0.5)' : C.border}`,
              background: variant === v ? 'rgba(124,115,255,0.12)' : C.item,
              color: variant === v ? C.purple : C.muted, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left',
            }}>
              <div style={{ fontSize: 15, marginBottom: 4 }}>Вариант {v}</div>
              <div style={{ fontSize: 12, fontWeight: 400, color: variant === v ? 'rgba(139,132,255,0.7)' : C.dim }}>
                {v === 'A' ? 'С ресвипом уровня' : 'Без ресвипа (OB + IFVG)'}
              </div>
            </button>
          ))}
        </div>

        {variant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {variantItems.map(item => (
              <CheckRow key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Result banner */}
      <div style={{
        borderRadius: 14, padding: '20px 24px', marginTop: 8,
        background: allDone ? 'rgba(61,255,160,0.08)' : 'rgba(249,115,22,0.06)',
        border: `1px solid ${allDone ? 'rgba(61,255,160,0.3)' : 'rgba(249,115,22,0.2)'}`,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 32 }}>{allDone ? '🚀' : '🚫'}</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: allDone ? C.green : C.red }}>
            {allDone ? 'Все пункты отмечены — можно входить' : 'Не все пункты выполнены — сделку не открывать'}
          </div>
          {!allDone && (
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {needVariant ? 'Выбери вариант входа и заполни все пункты' : `Осталось: ${totalCount - doneCount}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionBlock({ section, checked, onToggle }: {
  section: Section; checked: Set<string>; onToggle: (id: string) => void
}) {
  const done = section.items.filter(i => checked.has(i.id)).length
  const allDone = done === section.items.length
  return (
    <div style={{ background: C.card, border: `1px solid ${allDone ? 'rgba(61,255,160,0.2)' : C.border}`, borderRadius: 14, padding: '20px 22px', marginBottom: 12, transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{section.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{section.title}</span>
        </div>
        <span style={{ fontSize: 12, color: allDone ? C.green : C.dim, ...mono }}>{done}/{section.items.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {section.items.map(item => (
          <CheckRow key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => onToggle(item.id)} />
        ))}
      </div>
    </div>
  )
}

function CheckRow({ item, checked, onToggle }: { item: CheckItem; checked: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 9,
      background: checked ? 'rgba(61,255,160,0.06)' : C.item,
      border: `1px solid ${checked ? 'rgba(61,255,160,0.2)' : 'rgba(0,0,0,0.04)'}`,
      cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? C.green : C.dim}`,
        background: checked ? C.green : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, color: checked ? C.text : C.muted, transition: 'color 0.15s', lineHeight: 1.4 }}>{item.label}</div>
        {item.sub && <div style={{ fontSize: 12, color: C.dim, marginTop: 3 }}>{item.sub}</div>}
      </div>
    </div>
  )
}

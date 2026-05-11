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
    id: 's1', title: 'ЭТАП 1: Анализ контекста (Daily)', icon: '📅',
    items: [
      { id: '1_1', label: 'Определить долгосрочный тренд', sub: 'Куда движется цена? (Восходящий или нисходящий поток/Order Flow)' },
      { id: '1_2', label: 'Отметить ближайшую зону POI (Point of Interest)', sub: 'Дневной имбаланс (FVG) или Ордерблок / зона Sell-to-Buy / Buy-to-Sell' },
      { id: '1_3', label: 'Определить цель (Target)', sub: 'Ближайший значимый максимум или минимум (например, ATH)' },
      { id: '1_4', label: 'Оценить положение цены', sub: 'Находится ли цена в зоне Дискаунта или Премиума относительно текущего импульса' },
    ],
  },
  {
    id: 's2', title: 'ЭТАП 2: Подтверждение среднего срока (4H)', icon: '🔎',
    items: [
      { id: '2_1', label: 'Дождаться захода цены в дневную POI', sub: 'Не предпринимать действий до теста зоны' },
      { id: '2_2', label: 'Найти подтверждение на 4 часах', sub: 'Инверсия FVG, формирование новой POI, либо слом структуры/поглощение' },
      { id: '2_3', label: 'ВАЖНО: Не переходить на M15', sub: 'Пока 4H не показал «силу» (дисбаланс) в нужную сторону' },
    ],
  },
  {
    id: 's3', title: 'ЭТАП 3: Точка входа (M15)', icon: '🎯',
    items: [
      { id: '3_1', label: 'Дождаться теста 4-часовой зоны', sub: 'Вход осуществляется внутри среднего POI' },
      { id: '3_2', label: 'Выбрать торговую модель', sub: 'Модель QM (слом через перехай/перелой) или AMD (Накопление ➔ Манипуляция ➔ Расширение)' },
      { id: '3_3', label: 'Проверка ликвидности', sub: 'Оставила ли цена «полку» (цель) и сняла ли она ликвидность перед входом (защита)' },
    ],
  },
  {
    id: 's4', title: 'ЭТАП 4: Управление сделкой', icon: '🛡️',
    items: [
      { id: '4_1', label: 'Установка стоп-лосса', sub: 'За ключевой структурный экстремум m15 или за 4H манипуляцию' },
      { id: '4_2', label: 'Расчет Risk/Reward (R:R)', sub: 'Минимум 1:2 или 1:3 (статистический выход)' },
      { id: '4_3', label: 'Тайминг', sub: 'Сделка должна соответствовать торговым сессиям (Лондон или Нью-Йорк)' },
      { id: '4_4', label: 'Перевод в безубыток', sub: 'После снятия первого значимого таргета (ликвидности по тренду)' },
    ],
  },
  {
    id: 's5', title: '⚠️ Главные «НЕ»', icon: '🛑',
    items: [
      { id: '5_1', label: 'НЕ входи агрессивно на m15 сразу при касании дневного уровня' },
      { id: '5_2', label: 'НЕ пытайся шортить в лонговой зоне только потому, что цена «не дает лонговать»' },
      { id: '5_3', label: 'НЕ игнорируй отсутствие имбалансов', sub: 'Если их нет, цена пойдет выносить стопы, а не разворачиваться' },
    ],
  },
]

export default function Checklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setChecked(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })

  const allRequired = SECTIONS.flatMap(s => s.items)
  const totalCount = allRequired.length
  const doneCount = allRequired.filter(i => checked.has(i.id)).length
  const allDone = doneCount === totalCount
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const reset = () => { setChecked(new Set()) }

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
              {`Осталось: ${totalCount - doneCount}`}
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

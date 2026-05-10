import { useState } from 'react'
import { NEWS_ITEMS } from '../data/news'
import type { NewsItem, Tier } from '../data/news'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  green: '#10b981', red: '#f97316', yellow: '#f59e0b', purple: '#6366f1', blue: '#3b82f6',
  purpleBtn: '#4f46e5', orange: '#f97316'
}
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" }

const TIER_CFG: Record<Tier, { label: string; color: string; bg: string; border: string; dot: string }> = {
  1: { label: 'Tier 1', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', dot: '#f97316' },
  2: { label: 'Tier 2', color: '#ff9f43', bg: 'rgba(255,159,67,0.12)',  border: 'rgba(255,159,67,0.3)',  dot: '#ff9f43' },
  3: { label: 'Tier 3', color: '#ffd166', bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.3)', dot: '#ffd166' },
}

const TIER_TITLES: Record<Tier, string> = {
  1: '🔴 Tier 1 — Максимальное влияние',
  2: '🟠 Tier 2 — Сильное влияние',
  3: '🟡 Tier 3 — Контекстное влияние',
}

function TierBadge({ tier }: { tier: Tier }) {
  const t = TIER_CFG[tier]
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 5, fontWeight: 700,
      color: t.color, background: t.bg, border: `1px solid ${t.border}`,
    }}>{t.label}</span>
  )
}

function NewsCard({ item, isOpen, onToggle }: { item: NewsItem; isOpen: boolean; onToggle: () => void }) {
  const tier = TIER_CFG[item.tier]
  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${isOpen ? tier.border : C.border}`,
      background: isOpen ? `rgba(${item.tier === 1 ? '249,115,22' : item.tier === 2 ? '255,159,67' : '255,209,102'},0.04)` : C.card,
      transition: 'all 0.2s', marginBottom: 8, overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 20 }}>{item.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: isOpen ? tier.color : C.text }}>{item.name}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{item.period}{item.note ? ` · ${item.note}` : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <TierBadge tier={item.tier} />
          <span style={{ fontSize: 18, color: C.muted, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌃</span>
        </div>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '18px 18px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Что это</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{item.description}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 8 }}>↑ Бычий сценарий (рост GER40)</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item.bullish}</div>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginBottom: 8 }}>↓ Медвежий сценарий (падение GER40)</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item.bearish}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontSize: 12, color: C.purple, fontWeight: 700, marginBottom: 4 }}>Smart Money Note</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item.smNote}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StrategyTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Block 1 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Блок 1: Фундаментальная логика и Синхронизация</h2>
        </div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
          Все переменные факторы на старших и младших таймфреймах должны быть синхронизированы. Основа всего — понимание контекста и определение диапазонов поддержки/сопротивления. Не используйте агрессивные связки (М15-М1) в воздухе.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.item, padding: '14px 18px', borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 700, color: C.purple, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Долгосрок (Daily)</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>Наша задача определить две точки — зону поддержки (Support) и сопротивления (Resistance). Это может быть <strong>FVG (имбаланс)</strong>, <strong>Order Block</strong> или просто <strong>Sell-to-Buy / Buy-to-Sell</strong>.</div>
          </div>
          <div style={{ background: C.item, padding: '14px 18px', borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 700, color: C.blue, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Среднесрок (4H)</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>Здесь мы синхронизируем реакцию. Ищем реверс-модель (разворот) внутри дневной зоны (POI). Мы должны найти смену направления и формирование новой 4-часовой зоны.</div>
          </div>
          <div style={{ background: C.item, padding: '14px 18px', borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 700, color: C.green, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Краткосрок (M15)</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>Точка входа в позицию. Мы используем две модели: <strong>QM (Квазимодо)</strong> или <strong>AMD (аккумуляция, манипуляция, дистрибуция)</strong>.</div>
          </div>
        </div>
      </div>

      {/* Block 2 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🚫</span>
          <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Блок 2: Ошибка «Ложного входа»</h2>
        </div>
        <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
          <strong>Главная ошибка новичков:</strong> У нас есть дневной FVG. Цена приходит на его тест. Трейдер видит малейший отскок и сразу прыгает на М15. Это почти всегда убыток, так как 4-часовой период еще не сформировал реакции.
        </p>
        <div style={{ marginTop: 16, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', padding: '14px 18px', borderRadius: 10 }}>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
            Пока цена консолидируется в дневной зоне, вы можете получить серию рейдов (повторных снятий ликвидности) перед реальным разворотом. <br/><br/>
            <strong>Правило:</strong> Дождитесь дисбаланса со стороны спроса на 4 часах и только потом открывайте М15. Не игнорируйте средний срок!
          </div>
        </div>
      </div>

      {/* Block 3 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>⛰️</span>
          <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Блок 3: Правила работы в зоне ATH</h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
          <li>Когда цена на исторических максимумах (ATH), работать сложнее. Смотрите на 4 часа: если есть снятие ликвидности, но против вас стоит 4-часовой FVG, <strong>мы не имеем права лонговать</strong>, пока цена его не инвалидирует (проторгует насквозь).</li>
          <li><strong>Ловушка:</strong> Если цена не дает лонговать в лонговой зоне, трейдер начинает агрессивно шортить.</li>
          <li><strong>Решение:</strong> Сидеть на руках и ждать факторов. Не каждое движение нужно торговать. Суть фокуса в том, чтобы дождаться своего сетапа.</li>
        </ul>
      </div>

      {/* Block 4 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Блок 4: Детали модели AMD и Ликвидности</h2>
        </div>
        <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>
          Если цена тестирует 4-часовой FVG и внутри него долго консолидируется без ликвидности внутри имбаланса, она часто рисует модель <strong>AMD</strong>.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <div style={{ background: C.item, border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>1. Accumulation (Накопление)</div>
          <span style={{ color: C.muted }}>➔</span>
          <div style={{ background: 'rgba(249,115,22,0.1)', color: C.orange, border: `1px solid rgba(249,115,22,0.2)`, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>2. Manipulation (Снятие низов)</div>
          <span style={{ color: C.muted }}>➔</span>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: C.green, border: `1px solid rgba(16,185,129,0.2)`, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>3. Distribution (Расширение)</div>
        </div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>
          Если цена сформировала тест зоны и не улетела сразу, она строит ликвидность, чтобы использовать её как топливо. Ищем вход на М15 <strong>после рейда этой внутренней ликвидности</strong>.
        </p>
      </div>

      {/* Block 5 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🧘‍♂️</span>
          <h2 style={{ margin: 0, fontSize: 18, color: C.text, fontWeight: 700 }}>Блок 5: Психология и Менеджмент</h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
          <li>Старшие таймфреймы (4H и Daily) ментально комфортнее. Если система на М5 приносит стресс — меняйте её.</li>
          <li>Структурируйте работу через контекст. Возьмите 3-4 инструмента (например, EUR, GBP, GER40, Gold). Не пытайтесь ежедневно выжимать сделку из одного актива.</li>
          <li>Работайте в рамках жестких критериев: вы должны четко понимать зону валидации и инвалидации.</li>
          <li>Вы будете пропускать сделки, импульсы будут улетать без вас — это нормально. <strong>Главное — контроль риска.</strong></li>
        </ul>
      </div>
    </div>
  )
}

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<'news' | 'strategy'>('news')
  const [openId, setOpenId] = useState<string | null>(null)
  const [activeCountry, setActiveCountry] = useState<string>('all')

  const countries = ['all', '🇺🇸 США', '🇪🇺 Еврозона', '🇩🇪 Германия', '🇫🇷 Франция', '🇮🇹 Италия']

  const filtered = activeCountry === 'all'
    ? NEWS_ITEMS
    : NEWS_ITEMS.filter(n => `${n.flag} ${n.country}` === activeCountry)

  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ ...mono, fontSize: 24, color: C.text, fontWeight: 700 }}>База знаний</div>
          <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>Фундаментал и технический контекст</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        <button onClick={() => setActiveTab('news')} style={{
          background: activeTab === 'news' ? C.purpleBtn : 'transparent',
          color: activeTab === 'news' ? '#fff' : C.muted,
          border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
        }}>
          📰 Экономический календарь
        </button>
        <button onClick={() => setActiveTab('strategy')} style={{
          background: activeTab === 'strategy' ? C.purpleBtn : 'transparent',
          color: activeTab === 'strategy' ? '#fff' : C.muted,
          border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
        }}>
          🎯 Торговая стратегия
        </button>
      </div>

      {activeTab === 'news' ? (
        <div>
          {/* Country filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {countries.map(c => (
              <button key={c} onClick={() => setActiveCountry(c)} style={{
                background: activeCountry === c ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: activeCountry === c ? C.purple : C.muted,
                border: `1px solid ${activeCountry === c ? 'rgba(99,102,241,0.3)' : C.border}`,
                borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {c === 'all' ? 'Все' : c}
              </button>
            ))}
          </div>

          {/* News by tier */}
          {([1, 2, 3] as Tier[]).map(tier => {
            const items = filtered.filter(n => n.tier === tier)
            if (!items.length) return null
            const tCfg = TIER_CFG[tier]
            return (
              <div key={tier} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: tCfg.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: tCfg.color, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    {TIER_TITLES[tier]}
                  </span>
                  <span style={{ fontSize: 13, color: C.dim }}>· {items.length} событий</span>
                </div>
                {items.map(item => (
                  <NewsCard key={item.id} item={item} isOpen={openId === item.id} onToggle={() => toggle(item.id)} />
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <StrategyTab />
      )}
    </div>
  )
}

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
      background: isOpen ? `rgba(${item.tier === 1 ? '136,146,176' : item.tier === 2 ? '255,159,67' : '255,209,102'},0.04)` : C.card,
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
          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Что это</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{item.description}</div>
          </div>

          {/* Impact grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'rgba(61,255,160,0.06)', border: '1px solid rgba(61,255,160,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 8 }}>↑ Бычий сценарий (рост GER40)</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item.bullish}</div>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginBottom: 8 }}>↓ Медвежий сценарий (падение GER40)</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item.bearish}</div>
            </div>
          </div>

          {/* SM note */}
          <div style={{ background: 'rgba(124,115,255,0.08)', border: '1px solid rgba(124,115,255,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
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

export default function News() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [activeCountry, setActiveCountry] = useState<string>('all')

  const countries = ['all', '🇺🇸 США', '🇪🇺 Еврозона', '🇩🇪 Германия', '🇫🇷 Франция', '🇮🇹 Италия']

  const filtered = activeCountry === 'all'
    ? NEWS_ITEMS
    : NEWS_ITEMS.filter(n => `${n.flag} ${n.country}` === activeCountry)

  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id)

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...mono, fontSize: 20, color: C.text, fontWeight: 700 }}>Экономический календарь</div>
        <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>GER40 · EU50 · Smart Money · Источник: Forex Factory</div>
      </div>

      {/* Country filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {countries.map(c => (
          <button key={c} onClick={() => setActiveCountry(c)} style={{
            background: activeCountry === c ? 'rgba(124,115,255,0.2)' : 'transparent',
            color: activeCountry === c ? C.purple : C.muted,
            border: `1px solid ${activeCountry === c ? 'rgba(124,115,255,0.4)' : C.border}`,
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
  )
}

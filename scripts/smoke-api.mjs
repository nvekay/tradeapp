import process from 'node:process'

const API_URL = (process.env.SMOKE_API_URL || process.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const stamp = Date.now()
const email = `smoke+${stamp}@example.com`
const password = `Smoke-${stamp}-pass`

let token = ''
let factorId = 0
let strategyId = 0
let tradeId = 0

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body}` : ''}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function step(name, fn) {
  await fn()
  console.log(`PASS ${name}`)
}

async function main() {
  console.log(`Smoke API: ${API_URL}`)

  await step('auth.register', async () => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    token = data.access_token
    if (!token) throw new Error('missing token')
  })

  await step('auth.me', async () => {
    const me = await request('/auth/me')
    if (me.email !== email) throw new Error(`email mismatch: ${me.email}`)
  })

  await step('settings.patch', async () => {
    const settings = await request('/settings/', {
      method: 'PATCH',
      body: JSON.stringify({
        account_size: 10000,
        currency: 'USD',
        daily_loss_limit: -3,
        onboarding_completed: true,
      }),
    })
    if (!settings.onboarding_completed) throw new Error('onboarding not saved')
  })

  await step('symbols.create', async () => {
    const symbol = await request('/symbols/', {
      method: 'POST',
      body: JSON.stringify({ name: 'SMOKE' }),
    })
    if (!symbol.id) throw new Error('missing symbol id')
  })

  await step('factors.create', async () => {
    const factor = await request('/factors/', {
      method: 'POST',
      body: JSON.stringify({ name: `Smoke factor ${stamp}` }),
    })
    factorId = factor.id
  })

  await step('strategies.create', async () => {
    const strategy = await request('/strategies/', {
      method: 'POST',
      body: JSON.stringify({
        name: `Smoke strategy ${stamp}`,
        status: 'active',
        is_default: true,
        allowed_symbols: ['SMOKE'],
        allowed_directions: ['long'],
        allowed_sessions: ['london'],
      }),
    })
    strategyId = strategy.id
  })

  await step('trades.create', async () => {
    const trade = await request('/trades/', {
      method: 'POST',
      body: JSON.stringify({
        symbol: 'SMOKE',
        direction: 'long',
        risk: 1,
        rr: 2,
        result: 'take',
        date: new Date().toISOString(),
        session: 'london',
        notes: 'smoke test',
        psychology: ['Smoke discipline'],
        rating: 5,
        trade_type: 'trend',
        factor_ids: [factorId],
        strategy_id: strategyId,
        screenshots: [{ label: '5m', url: 'https://www.tradingview.com/x/abc123/' }],
      }),
    })
    tradeId = trade.id
    if (trade.pnl_pct !== 2) throw new Error(`unexpected pnl ${trade.pnl_pct}`)
  })

  await step('trades.detail', async () => {
    const trade = await request(`/trades/${tradeId}`)
    if (trade.symbol !== 'SMOKE') throw new Error('trade detail mismatch')
  })

  await step('journal.create/read', async () => {
    const day = new Date().toISOString().slice(0, 10)
    await request('/journal/', {
      method: 'POST',
      body: JSON.stringify({
        date: day,
        pre_mood: 4,
        pre_plan: 'smoke plan',
        post_mood: 4,
        post_learned: 'smoke learned',
      }),
    })
    const journal = await request(`/journal/${day}`)
    if (journal.date !== day) throw new Error('journal mismatch')
  })

  await step('stats.summary', async () => {
    const summary = await request('/stats/summary')
    if (summary.total_trades < 1) throw new Error('summary has no trades')
  })

  await step('trades.delete', async () => {
    await request(`/trades/${tradeId}`, { method: 'DELETE' })
  })
}

main().catch(err => {
  console.error(`FAIL ${err.message}`)
  process.exit(1)
})

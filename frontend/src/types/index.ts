export type Direction = 'long' | 'short'
export type TradeResult = 'take' | 'stop' | 'b/e'
export type Session = 'london' | 'new_york' | 'asian' | 'overlap'
export type TradeType = 'trend' | 'countertrend'

export interface Factor {
  id: number
  name: string
}

export interface Trade {
  id: number
  symbol: string
  direction: Direction
  risk: number
  rr: number
  result: TradeResult
  pnl_pct: number
  date: string
  session: Session
  notes: string | null
  screenshot_5m: string | null
  screenshot_1h: string | null
  screenshot_4h: string | null
  psychology: string[]
  rating: number
  trade_type: TradeType | null
  factors: Factor[]
}

export interface TradeCreate {
  symbol: string
  direction: Direction
  risk: number
  rr: number
  result: TradeResult
  date: string
  session: Session
  notes?: string
  screenshot_5m?: string
  screenshot_1h?: string
  screenshot_4h?: string
  psychology?: string[]
  rating?: number
  trade_type?: TradeType | null
  factor_ids?: number[]
}

export interface TradeUpdate extends Partial<TradeCreate> {}

// --- Stats ---

export interface StatsSummary {
  total_trades: number
  winrate: number
  total_pnl_pct: number
  avg_pnl_pct: number
  avg_win: number
  avg_loss: number
  max_drawdown: number
  best_trade: { id: number; pnl_pct: number; symbol: string; date: string } | null
  worst_trade: { id: number; pnl_pct: number; symbol: string; date: string } | null
}

export interface PnlPoint {
  date: string
  pnl_pct: number
  trade_id: number
}

export interface SymbolStat {
  symbol: string
  total_trades: number
  winrate: number
  total_pnl_pct: number
  avg_pnl_pct: number
}

export interface TagStat {
  tag: string
  total_trades: number
  winrate: number
  avg_pnl_pct: number
}

export interface FactorStat {
  factor: string
  total_trades: number
  winrate: number
  avg_pnl_pct: number
}

export interface MoodStat {
  mood: number
  total_trades: number
  winrate: number
  avg_pnl_pct: number
}

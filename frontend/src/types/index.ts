export type Direction = 'long' | 'short'
export type TradeResult = 'take' | 'stop' | 'b/e' | 'open'
export type Session = 'london' | 'new_york' | 'asian' | 'overlap'
export type TradeType = 'trend' | 'countertrend'

export interface Factor {
  id: number
  name: string
}

export interface Screenshot { label: string; url: string }

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
  screenshot_5m?: string | null
  screenshot_1h?: string | null
  screenshot_4h?: string | null
  screenshots: Screenshot[]
  psychology: string[]
  rating: number
  trade_type: TradeType | null
  factors: Factor[]
  strategy_id?: number | null
  is_backtest?: boolean
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
  screenshots?: Screenshot[]
  psychology?: string[]
  rating?: number
  trade_type?: TradeType | null
  factor_ids?: number[]
  strategy_id?: number | null
  is_backtest?: boolean
}

export type TradeUpdate = Partial<TradeCreate>

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


// --- Strategy ---

export type StrategyStatus = 'active' | 'draft' | 'archived'

export interface Strategy {
  id: number
  name: string
  description?: string | null
  status: StrategyStatus
  color?: string | null
  emoji?: string | null
  allowed_directions: Direction[]
  allowed_sessions: Session[]
  allowed_symbols: string[]
  trade_type?: TradeType | null
  max_risk_pct: number
  min_rr: number
  setup_checklist: string[]
  is_default: boolean
  sl_logic?: string | null
  tp_logic?: string | null
  created_at: string
  updated_at: string
  total_trades: number
  winrate: number
  total_pnl_pct: number
  avg_rr: number
}

export interface StrategyCreate {
  name: string
  description?: string
  status?: StrategyStatus
  color?: string
  emoji?: string
  allowed_directions?: Direction[]
  allowed_sessions?: Session[]
  allowed_symbols?: string[]
  trade_type?: TradeType | null
  max_risk_pct?: number
  min_rr?: number
  setup_checklist?: string[]
  is_default?: boolean
  sl_logic?: string
  tp_logic?: string
}

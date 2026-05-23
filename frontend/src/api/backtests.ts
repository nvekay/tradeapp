import client from './client'
import type { Factor, Direction, TradeResult, TradeType } from '../types'

export interface BacktestTrade {
  id: number
  symbol: string
  direction: Direction
  risk: number
  rr: number
  result: TradeResult
  pnl_pct: number
  date: string
  session: string
  psychology: string[]
  trade_type: TradeType | null
  factors: Factor[]
  strategy_id?: number | null
}

export interface BacktestTradeCreate {
  symbol: string
  direction: Direction
  risk: number
  rr: number
  result: TradeResult
  date: string
  session: string
  psychology?: string[]
  trade_type?: TradeType | null
  factor_ids?: number[]
  strategy_id?: number | null
}

export const getBacktestTrades = (filters?: Record<string, string>) =>
  client.get<BacktestTrade[]>('/backtests/', { params: filters }).then(r => r.data)

export const createBacktestTrade = (data: BacktestTradeCreate) =>
  client.post<BacktestTrade>('/backtests/', data).then(r => r.data)

export const deleteBacktestTrade = (id: number) =>
  client.delete(`/backtests/${id}`)

import client from './client'
import type { Factor, Direction, TradeResult, TradeType } from '../types'

export interface BacktestSession {
  id: number
  name: string
  symbol: string
  start_date: string
  end_date: string
  strategy_id?: number | null
  created_at: string
}

export interface BacktestSessionCreate {
  name: string
  symbol: string
  start_date: string
  end_date: string
  strategy_id?: number | null
}

export interface BacktestTrade {
  id: number
  backtest_session_id: number
  direction: Direction
  risk: number
  rr: number
  result: TradeResult
  pnl_pct: number
  date: string
  session: string
  trade_type: TradeType | null
  psychology: string[]
  factors: Factor[]
}

export interface BacktestTradeCreate {
  backtest_session_id: number
  direction: Direction
  risk: number
  rr: number
  result: TradeResult
  date: string
  session: string
  trade_type?: TradeType | null
  psychology?: string[]
  factor_ids?: number[]
}

export const getBacktestSessions = () =>
  client.get<BacktestSession[]>('/backtests/sessions').then(r => r.data)

export const createBacktestSession = (data: BacktestSessionCreate) =>
  client.post<BacktestSession>('/backtests/sessions', data).then(r => r.data)

export const getBacktestSession = (id: number) =>
  client.get<BacktestSession>(`/backtests/sessions/${id}`).then(r => r.data)

export const deleteBacktestSession = (id: number) =>
  client.delete(`/backtests/sessions/${id}`)

export const getBacktestTrades = (filters?: Record<string, any>) =>
  client.get<BacktestTrade[]>('/backtests/trades', { params: filters }).then(r => r.data)

export const createBacktestTrade = (data: BacktestTradeCreate) =>
  client.post<BacktestTrade>('/backtests/trades', data).then(r => r.data)

export const deleteBacktestTrade = (id: number) =>
  client.delete(`/backtests/trades/${id}`)

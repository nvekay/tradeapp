import client from './client'
import type { Trade, TradeCreate, TradeUpdate } from '../types'

export interface TradeFilters {
  symbol?: string
  direction?: string
  result?: string
  rating?: number
  from?: string
  to?: string
}

export const getTrades = (filters?: TradeFilters) =>
  client.get<Trade[]>('/trades/', { params: filters }).then(r => r.data)

export const getTrade = (id: number) =>
  client.get<Trade>(`/trades/${id}`).then(r => r.data)

export const createTrade = (data: TradeCreate) =>
  client.post<Trade>('/trades/', data).then(r => r.data)

export const updateTrade = (id: number, data: TradeUpdate) =>
  client.put<Trade>(`/trades/${id}`, data).then(r => r.data)

export const deleteTrade = (id: number) =>
  client.delete(`/trades/${id}`)

export const importHtml = (file: File, balance: number = 100000.0) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('balance', balance.toString())
  return client.post<{ imported: number }>('/trades/import-html', formData).then(r => r.data)
}

export const getExportUrl = (filters?: TradeFilters) => {
  const base = `${client.defaults.baseURL}/trades/export-csv`
  if (!filters) return base
  const params = new URLSearchParams()
  if (filters.symbol)    params.set('symbol', filters.symbol)
  if (filters.direction) params.set('direction', filters.direction)
  if (filters.result)    params.set('result', filters.result)
  if (filters.rating != null) params.set('rating', String(filters.rating))
  if (filters.from)      params.set('from', filters.from)
  if (filters.to)        params.set('to', filters.to)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

import client from './client'
import type { Strategy, StrategyCreate } from '../types'

export const listStrategies = () =>
  client.get<Strategy[]>('/strategies/').then(r => r.data)

export const getStrategy = (id: number) =>
  client.get<Strategy>(`/strategies/${id}`).then(r => r.data)

export const createStrategy = (data: StrategyCreate) =>
  client.post<Strategy>('/strategies/', data).then(r => r.data)

export const updateStrategy = (id: number, data: Partial<StrategyCreate>) =>
  client.put<Strategy>(`/strategies/${id}`, data).then(r => r.data)

export const deleteStrategy = (id: number) =>
  client.delete(`/strategies/${id}`).then(r => r.data)

import client from './client'
import type { Factor } from '../types'

export const getFactors = () =>
  client.get<Factor[]>('/factors/').then(r => r.data)

export const createFactor = (name: string) =>
  client.post<Factor>('/factors/', { name }).then(r => r.data)

export const deleteFactor = (id: number) =>
  client.delete(`/factors/${id}`)

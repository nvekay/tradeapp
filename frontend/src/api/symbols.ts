import client from './client'

export interface UserSymbol { id: number; name: string }

export const getSymbols = () =>
  client.get<UserSymbol[]>('/symbols/').then(r => r.data)

export const createSymbol = (name: string) =>
  client.post<UserSymbol>('/symbols/', { name }).then(r => r.data)

export const deleteSymbol = (id: number) =>
  client.delete(`/symbols/${id}`)

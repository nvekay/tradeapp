import client from './client'
import type { StatsSummary, PnlPoint, SymbolStat, TagStat, FactorStat, MoodStat } from '../types'

export interface DateRange { from?: string; to?: string }

export const getSummary      = (r?: DateRange) => client.get<StatsSummary>('/stats/summary',      { params: r }).then(d => d.data)
export const getPnlCurve     = (r?: DateRange) => client.get<PnlPoint[]>('/stats/pnl-curve',      { params: r }).then(d => d.data)
export const getBySymbol     = (r?: DateRange) => client.get<SymbolStat[]>('/stats/by-symbol',    { params: r }).then(d => d.data)
export const getByPsychology = (r?: DateRange) => client.get<TagStat[]>('/stats/by-psychology',   { params: r }).then(d => d.data)
export const getByFactor     = (r?: DateRange) => client.get<FactorStat[]>('/stats/by-factor',    { params: r }).then(d => d.data)
export const getJournalCorrelation = (r?: DateRange) => client.get<MoodStat[]>('/stats/journal-correlation', { params: r }).then(d => d.data)

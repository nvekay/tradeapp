import client from './client'

export interface WeeklyPlan {
  id: number
  week_start: string
  focus?: string | null
  watchlist?: string | null
  risk_plan?: string | null
  notes?: string | null
  updated_at: string
}

export interface WeeklyPlanUpsert {
  week_start: string
  focus?: string | null
  watchlist?: string | null
  risk_plan?: string | null
  notes?: string | null
}

export const getWeeklyPlan = (weekStart: string) =>
  client.get<WeeklyPlan>(`/weekly-plans/${weekStart}`).then(r => r.data)

export const saveWeeklyPlan = (weekStart: string, data: WeeklyPlanUpsert) =>
  client.put<WeeklyPlan>(`/weekly-plans/${weekStart}`, data).then(r => r.data)

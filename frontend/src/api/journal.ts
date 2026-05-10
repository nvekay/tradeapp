import client from './client'

export interface DailyJournal {
  id: number
  date: string
  pre_mood?: number | null
  pre_plan?: string | null
  post_mood?: number | null
  post_learned?: string | null
}

export interface DailyJournalCreate {
  date: string
  pre_mood?: number | null
  pre_plan?: string | null
  post_mood?: number | null
  post_learned?: string | null
}

export interface DailyJournalUpdate {
  pre_mood?: number | null
  pre_plan?: string | null
  post_mood?: number | null
  post_learned?: string | null
}

export const getJournalDates = () =>
  client.get<string[]>('/journal/dates').then(r => r.data)

export const getJournal = (date: string) =>
  client.get<DailyJournal>(`/journal/${date}`).then(r => r.data)

export const createJournal = (data: DailyJournalCreate) =>
  client.post<DailyJournal>('/journal/', data).then(r => r.data)

export const updateJournal = (date: string, data: DailyJournalUpdate) =>
  client.put<DailyJournal>(`/journal/${date}`, data).then(r => r.data)

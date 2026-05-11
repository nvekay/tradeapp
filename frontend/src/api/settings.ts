import client from './client'

export interface UserSettings {
  account_size: number
  currency: string
  daily_loss_limit?: number | null
  onboarding_completed: boolean
}

export const getSettings = () =>
  client.get<UserSettings>('/settings/').then(r => r.data)

export const updateSettings = (data: Partial<UserSettings>) =>
  client.patch<UserSettings>('/settings/', data).then(r => r.data)

export const exportAllUrl = () =>
  `${client.defaults.baseURL}/export/all`

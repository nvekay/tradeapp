import client from './client'

export interface PsychologyTag { id: number; name: string }

export const getPsychologyTags = () =>
  client.get<PsychologyTag[]>('/psychology/').then(r => r.data)

export const createPsychologyTag = (name: string) =>
  client.post<PsychologyTag>('/psychology/', { name }).then(r => r.data)

export const deletePsychologyTag = (id: number) =>
  client.delete(`/psychology/${id}`)

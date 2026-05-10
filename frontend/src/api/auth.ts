import client from './client'

export const login = (data: any) =>
  client.post('/auth/login', data).then(r => r.data)

export const register = (data: any) =>
  client.post('/auth/register', data).then(r => r.data)

export const googleLogin = (data: any) =>
  client.post('/auth/google', data).then(r => r.data)

export const getMe = () =>
  client.get('/auth/me').then(r => r.data)

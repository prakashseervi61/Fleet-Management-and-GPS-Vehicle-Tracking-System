import axiosClient from './axiosClient'

export function login(credentials) {
  return axiosClient.post('/auth/login', credentials).then((res) => res.data)
}

export function register(payload) {
  return axiosClient.post('/auth/register', payload).then((res) => res.data)
}

export function logout() {
  return axiosClient.post('/auth/logout').then((res) => res.data)
}

export function getProfile() {
  return axiosClient.get('/users/profile').then((res) => res.data)
}

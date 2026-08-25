import axiosClient from './axiosClient'

export function login({ email, password }) {
  return axiosClient
    .post('/auth/login', { identifier: email, password })
    .then((res) => res.data)
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

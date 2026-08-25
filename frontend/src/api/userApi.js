import axiosClient from './axiosClient'

export function createUser(payload) {
  return axiosClient.post('/users', payload).then((res) => res.data)
}

export function getUsers() {
  return axiosClient.get('/users').then((res) => res.data)
}

export function getUserById(id) {
  return axiosClient.get(`/users/${id}`).then((res) => res.data)
}

export function getUserByEmail(email) {
  return axiosClient.get(`/users/email/${email}`).then((res) => res.data)
}

export function updateUser(id, payload) {
  return axiosClient.put(`/users/${id}`, payload).then((res) => res.data)
}

export function deleteUser(id) {
  return axiosClient.delete(`/users/${id}`).then((res) => res.data)
}

export function deactivateUser(id) {
  return axiosClient.patch(`/users/${id}/deactivate`).then((res) => res.data)
}

import axiosClient from './axiosClient'

export function createTrip(payload) {
  return axiosClient.post('/trips', payload).then((res) => res.data)
}

export function getTrips() {
  return axiosClient.get('/trips').then((res) => res.data)
}

export function getActiveTrips() {
  return axiosClient.get('/trips/active').then((res) => res.data)
}

export function getTripById(id) {
  return axiosClient.get(`/trips/${id}`).then((res) => res.data)
}

export function startTrip(id) {
  return axiosClient.post(`/trips/${id}/start`).then((res) => res.data)
}

export function completeTrip(id, distanceKm) {
  return axiosClient.post(`/trips/${id}/complete`, null, { params: { distanceKm } }).then((res) => res.data)
}

export function cancelTrip(id) {
  return axiosClient.post(`/trips/${id}/cancel`).then((res) => res.data)
}

import axiosClient from './axiosClient'

export function createVehicle(payload) {
  return axiosClient.post('/vehicles', payload).then((res) => res.data)
}

export function getVehicles() {
  return axiosClient.get('/vehicles').then((res) => res.data)
}

export function getVehicleById(id) {
  return axiosClient.get(`/vehicles/${id}`).then((res) => res.data)
}

export function updateVehicle(id, payload) {
  return axiosClient.put(`/vehicles/${id}`, payload).then((res) => res.data)
}

export function deleteVehicle(id) {
  return axiosClient.delete(`/vehicles/${id}`).then((res) => res.data)
}

export function assignDriver(id, driverId) {
  return axiosClient.post(`/vehicles/${id}/assign-driver`, null, { params: { driverId } }).then((res) => res.data)
}

export function getVehicleLocation(id) {
  return axiosClient.get(`/vehicles/${id}/location`).then((res) => res.data)
}

import axiosClient from './axiosClient'

export function createGeofence(payload) {
  return axiosClient.post('/geofence', payload).then((res) => res.data)
}

export function getGeofences() {
  return axiosClient.get('/geofence').then((res) => res.data)
}

export function updateGeofence(id, payload) {
  return axiosClient.put(`/geofence/${id}`, payload).then((res) => res.data)
}

export function deleteGeofence(id) {
  return axiosClient.delete(`/geofence/${id}`).then((res) => res.data)
}

export function getGeofenceAlerts() {
  return axiosClient.get('/geofence/alerts').then((res) => res.data)
}

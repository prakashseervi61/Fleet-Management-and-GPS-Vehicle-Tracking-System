import axiosClient from './axiosClient'

export function createGeofence(payload) {
  return axiosClient.post('/geofences', payload).then((res) => res.data)
}

export function getGeofences() {
  return axiosClient.get('/geofences').then((res) => res.data)
}

export function updateGeofence(id, payload) {
  return axiosClient.put(`/geofences/${id}`, payload).then((res) => res.data)
}

export function deleteGeofence(id) {
  return axiosClient.delete(`/geofences/${id}`).then((res) => res.data)
}

export function getGeofenceAlerts() {
  return axiosClient.get('/geofences/alerts').then((res) => res.data)
}

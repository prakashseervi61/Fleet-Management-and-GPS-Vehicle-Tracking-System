import axiosClient from './axiosClient'

export function createMaintenance(payload) {
  return axiosClient.post('/maintenance', payload).then((res) => res.data)
}

export function getMaintenanceRecords() {
  return axiosClient.get('/maintenance').then((res) => res.data)
}

export function getMaintenanceById(id) {
  return axiosClient.get(`/maintenance/${id}`).then((res) => res.data)
}

export function updateMaintenance(id, payload) {
  return axiosClient.put(`/maintenance/${id}`, payload).then((res) => res.data)
}

export function deleteMaintenance(id) {
  return axiosClient.delete(`/maintenance/${id}`).then((res) => res.data)
}

export function getMaintenanceByVehicle(vehicleId) {
  return axiosClient.get(`/maintenance/vehicle/${vehicleId}`).then((res) => res.data)
}

export function completeMaintenance(id, cost) {
  return axiosClient.post(`/maintenance/${id}/complete`, null, { params: { cost } }).then((res) => res.data)
}

export function triggerOdometerMaintenance() {
  return axiosClient.post('/maintenance/triggers/odometer').then((res) => res.data)
}

import axiosClient from './axiosClient'

export function createFuelLog(payload) {
  return axiosClient.post('/fuel/log', payload).then((res) => res.data)
}

export function getFuelLogs() {
  return axiosClient.get('/fuel/log').then((res) => res.data)
}

export function getFuelLogById(id) {
  return axiosClient.get(`/fuel/log/${id}`).then((res) => res.data)
}

export function getFuelLogsByVehicle(vehicleId) {
  return axiosClient.get(`/fuel/log/vehicle/${vehicleId}`).then((res) => res.data)
}

export function getFuelLogsByDriver(driverId) {
  return axiosClient.get(`/fuel/log/driver/${driverId}`).then((res) => res.data)
}

export function deleteFuelLog(id) {
  return axiosClient.delete(`/fuel/log/${id}`).then((res) => res.data)
}

export function getFuelCostSummary(from, to) {
  return axiosClient.get('/fuel/log/cost', { params: { from, to } }).then((res) => res.data)
}

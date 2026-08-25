import axiosClient from './axiosClient'

export function pingLocation(vehicleId, payload) {
  return axiosClient.post('/gps/ping', payload, { params: { vehicleId } }).then((res) => res.data)
}

export function getHistory(vehicleId) {
  return axiosClient.get(`/gps/history/${vehicleId}`).then((res) => res.data)
}

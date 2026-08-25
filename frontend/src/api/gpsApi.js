import axiosClient from './axiosClient'

export function pingLocation(payload) {
  return axiosClient.post('/gps/ping', payload).then((res) => res.data)
}

export function getHistory(vehicleId) {
  return axiosClient.get(`/gps/history/${vehicleId}`).then((res) => res.data)
}

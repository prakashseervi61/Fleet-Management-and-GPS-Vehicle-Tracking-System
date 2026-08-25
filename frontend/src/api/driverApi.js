import axiosClient from './axiosClient'

export function getDriverScore(driverId) {
  return axiosClient.get(`/drivers/${driverId}/score`).then((res) => res.data)
}

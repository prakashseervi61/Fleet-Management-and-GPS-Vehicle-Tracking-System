import axiosClient from './axiosClient'

export function getFleetMap() {
  return axiosClient.get('/fleet/map').then((res) => res.data)
}

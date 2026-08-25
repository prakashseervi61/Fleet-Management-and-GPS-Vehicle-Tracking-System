import axiosClient from './axiosClient'

export function uploadDocument(payload) {
  return axiosClient.post('/documents', payload).then((res) => res.data)
}

export function getDocuments() {
  return axiosClient.get('/documents').then((res) => res.data)
}

export function getDocumentById(id) {
  return axiosClient.get(`/documents/${id}`).then((res) => res.data)
}

export function getExpiringDocuments() {
  return axiosClient.get('/documents/expiry').then((res) => res.data)
}

export function getDocumentsByVehicle(vehicleId) {
  return axiosClient.get(`/documents/vehicle/${vehicleId}`).then((res) => res.data)
}

export function updateDocument(id, payload) {
  return axiosClient.put(`/documents/${id}`, payload).then((res) => res.data)
}

export function deleteDocument(id) {
  return axiosClient.delete(`/documents/${id}`).then((res) => res.data)
}

export function refreshDocumentStatuses() {
  return axiosClient.post('/documents/refresh').then((res) => res.data)
}

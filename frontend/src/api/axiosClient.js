import axios from 'axios'
import { API_BASE_URL, AUTH_UNAUTHORIZED_EVENT } from '../constants/config'
import { clearToken, getToken } from '../utils/tokenStorage'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function extractBackendMessage(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  return data.message || data.error || null
}

function friendlyMessage(status) {
  switch (status) {
    case 400:
      return 'Invalid request. Please check the submitted data.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return "You don't have permission to perform this action."
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'This record already exists.'
    default:
      return status >= 500
        ? 'Something went wrong on our side. Please try again.'
        : 'Unexpected error. Please try again.'
  }
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      clearToken()
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }

    if (!error.response) {
      const networkError = new Error(
        'Cannot reach the server. Check your connection and try again.'
      )
      networkError.isNetworkError = true
      return Promise.reject(networkError)
    }

    const normalized = new Error(extractBackendMessage(data) || friendlyMessage(status))
    normalized.status = status
    normalized.data = data
    normalized.errors =
      data && typeof data === 'object' && data.errors && typeof data.errors === 'object'
        ? data.errors
        : null

    return Promise.reject(normalized)
  }
)

export default axiosClient

import axios, { AxiosError } from 'axios'
import { getCachedCSRFToken } from './csrf'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || ''

// Endpoints that are expected to return 404 in normal operation
const EXPECTED_404_ENDPOINTS = ['/pomodoro/sessions/active'];

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in cross-origin requests
})

// Request interceptor to add CSRF token
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token for state-changing requests
    const method = config.method?.toUpperCase()
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Always try to get fresh token from cookie first, fall back to cache
      const csrfToken = getCachedCSRFToken()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Special handling for expected 404 errors
    const isExpected404 = 
      error.response?.status === 404 && 
      error.config?.url && 
      error.config?.method?.toLowerCase() === 'get' &&
      EXPECTED_404_ENDPOINTS.some(endpoint => error.config?.url?.includes(endpoint));
    
    if (isExpected404) {
      // This is an expected error, return without logging
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Don't redirect if already on auth pages or if it's the auth check endpoint
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/register'
      const isAuthCheckEndpoint = error.config?.url?.includes('/auth/me')
      
      if (!isAuthPage && !isAuthCheckEndpoint) {
        // Redirect to login on unauthorized
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
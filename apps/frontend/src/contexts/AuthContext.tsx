import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api-client'
import { setCachedCSRFToken } from '@/lib/csrf'

interface User {
  id: string
  username: string
  email: string
  roles: string[]
}

interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      error?: string
      message?: string
    }
  }
}

function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    ('error' in error.response.data || 'message' in error.response.data)
  )
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_VERIFICATION_ERROR'; payload: string }

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'AUTH_VERIFICATION_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        // Maintain existing authentication state
      }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  checkAuth: (retryCount?: number) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' })
    
    try {
      const response = await apiClient.post('/api/v1/auth/login', { email, password })
      const { user, csrfToken } = response.data
      
      // Cache CSRF token if provided
      if (csrfToken) {
        setCachedCSRFToken(csrfToken)
      }
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
      toast.success(`Welcome back, ${user.username}!`)
    } catch (error) {
      const message = isApiError(error) ? error.response?.data?.error || error.response?.data?.message || 'Login failed' : 'Login failed'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      toast.error(message)
      throw error
    }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' })
    
    try {
      const response = await apiClient.post('/api/v1/auth/register', { 
        username, 
        email, 
        password 
      })
      const { user, csrfToken } = response.data
      
      // Cache CSRF token if provided
      if (csrfToken) {
        setCachedCSRFToken(csrfToken)
      }
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
      toast.success(`Welcome, ${user.username}! Account created successfully.`)
    } catch (error) {
      const message = isApiError(error) ? error.response?.data?.error || error.response?.data?.message || 'Registration failed' : 'Registration failed'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      toast.error(message)
      throw error
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      // Clear state first to prevent any race conditions
      dispatch({ type: 'AUTH_LOGOUT' })
      setCachedCSRFToken(null)
      
      // Then send logout request to backend to clear cookies
      await apiClient.post('/api/v1/auth/logout')
      
      toast.success('You have been logged out successfully.')
    } catch (error) {
      console.warn('Logout request failed:', error)
      // Even if backend logout fails, we've already cleared frontend state
      toast.success('You have been logged out successfully.')
    } finally {
      // Use replace to prevent back button issues
      window.location.replace('/')
    }
  }, [])

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const checkAuth = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING' })
      const response = await apiClient.get('/api/v1/auth/me')
      
      // Extract csrf token and user fields from /auth/me response
      const { csrfToken, ...userFields } = response.data ?? {}
      
      // Cache CSRF token if provided
      if (csrfToken) {
        setCachedCSRFToken(csrfToken)
      }
      
      // Normalize user shape (ensure roles field exists)
      const user: User = {
        id: userFields.id,
        username: userFields.username,
        email: userFields.email,
        roles: Array.isArray(userFields.roles) ? userFields.roles : [],
      }
      
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
    } catch (error) {
      const axiosError = error as ApiErrorResponse
      
      // Handle definitive unauthorized responses
      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        dispatch({ type: 'AUTH_LOGOUT' })
        console.warn('Auth check failed with unauthorized status:', error)
      } 
      // Retry on network errors (no response object means network error)
      else if (retryCount < 3 && !axiosError?.response) {
        console.warn(`Auth check network error, retrying (${retryCount + 1}/3)...`)
        setTimeout(() => checkAuth(retryCount + 1), Math.pow(2, retryCount) * 1000)
      } 
      // For other errors, maintain current auth state
      else {
        dispatch({ type: 'AUTH_VERIFICATION_ERROR', payload: 'Unable to verify authentication' })
        console.warn('Auth check failed, maintaining current state:', error)
      }
    }
  }, [])

  // Check authentication on mount
  useEffect(() => {
    // Add a small delay to ensure cookies are properly set/cleared after navigation
    const timeoutId = setTimeout(() => {
      checkAuth(0)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [checkAuth])

  const value: AuthContextType = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    clearError,
    checkAuth,
  }), [state, login, register, logout, clearError, checkAuth])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
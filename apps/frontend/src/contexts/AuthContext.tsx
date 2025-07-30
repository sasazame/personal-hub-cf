import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  username: string
  email: string
  roles: string[]
}

interface ApiErrorResponse {
  response?: {
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
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  checkAuth: () => Promise<void>
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
      const { user, accessToken } = response.data
      
      // Store token
      localStorage.setItem('accessToken', accessToken)
      
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
      const { user, accessToken } = response.data
      
      // Store token
      localStorage.setItem('accessToken', accessToken)
      
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
      await apiClient.post('/api/v1/auth/logout')
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      localStorage.removeItem('accessToken')
      dispatch({ type: 'AUTH_LOGOUT' })
      toast.success('You have been logged out successfully.')
    }
  }, [])

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const checkAuth = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      dispatch({ type: 'AUTH_LOGOUT' })
      return
    }

    try {
      dispatch({ type: 'AUTH_LOADING' })
      const response = await apiClient.get('/api/v1/auth/me')
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data })
    } catch (error) {
      localStorage.removeItem('accessToken')
      dispatch({ type: 'AUTH_LOGOUT' })
      console.warn('Auth check failed:', error)
    }
  }, [])

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    checkAuth,
  }

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
import axios from 'axios'

// Build API URL with proper slash handling
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : 'http://localhost:4000/api'
console.log('🔗 AuthService VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('🔗 AuthService API_BASE_URL:', API_BASE_URL)

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface User {
  _id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  lastLogin?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    tokens: {
      accessToken: string
      refreshToken: string
      expiresIn: string
    }
  }
}

class AuthService {
  private getToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  private setToken(token: string): void {
    localStorage.setItem('accessToken', token)
  }

  private removeToken(): void {
    localStorage.removeItem('accessToken')
  }

  // Set up axios interceptor to include auth token
  setupInterceptors(): void {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, redirect to login
          this.logout()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials)
    if (response.data.success) {
      this.setToken(response.data.data.tokens.accessToken)
    }
    return response.data
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, userData)
    if (response.data.success) {
      this.setToken(response.data.data.tokens.accessToken)
    }
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<{ success: boolean; data: User }>(`${API_BASE_URL}/auth/verify`)
    return response.data.data
  }

  logout(): void {
    this.removeToken()
    // Clear any other auth-related data
    localStorage.removeItem('refreshToken')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const authService = new AuthService()

"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { apiService } from "@/lib/api"

interface User {
  _id: string
  username: string
  email: string
  name: string
  phoneNumber: string
  whatsappNumber: string
  createdAt: string
  updatedAt: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  name: string
  phone: string
  whatsapp: string
}

interface ProfileData {
  email: string
  phoneNumber: string
  whatsappNumber: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<{ error?: string; success?: boolean }>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (profileData: ProfileData) => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading=true
  const logoutTimerRef = useRef<number | null>(null)

  const parseJwt = (jwtToken: string): { exp?: number } | null => {
    try {
      const base64Url = jwtToken.split('.')[1]
      if (!base64Url) return null
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  const scheduleLogoutAtExpiry = (jwtToken: string) => {
    // Clear previous timer
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
    const payload = parseJwt(jwtToken)
    if (!payload?.exp) return
    const expiresAtMs = payload.exp * 1000
    const now = Date.now()
    const msUntilExpiry = Math.max(0, expiresAtMs - now)
    // If already expired, logout immediately
    if (msUntilExpiry === 0) {
      logout()
      return
    }
    logoutTimerRef.current = window.setTimeout(() => {
      logout()
    }, msUntilExpiry)
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        
        if (storedToken && storedUser) {
          // If stored token expired, clear it
          const payload = parseJwt(storedToken)
          if (payload?.exp && payload.exp * 1000 <= Date.now()) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          } else {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
            scheduleLogoutAtExpiry(storedToken)
          }
        } else {
        }
      } catch (error) {
        console.error('AuthContext: Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setLoading(false) // Always set loading to false when done
      }
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const response = await apiService.login(username, password)
      
      if (response.error) {
        // Don't throw error, just return it so the UI can handle it gracefully
        return { error: response.error }
      }
      
      if (response.data) {
        const { user, token } = (response.data as any)
        setUser(user)
        setToken(token)
        

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        scheduleLogoutAtExpiry(token)
        
        return { success: true }
      }
      
      return { error: 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { error: 'Network error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setLoading(true)
    try {
      const response = await apiService.register(userData)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data) {
        const { user, token } = (response.data as any)
        setUser(user)
        setToken(token)
        

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        scheduleLogoutAtExpiry(token)
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  
  }

  const updateProfile = async (profileData: ProfileData) => {
    try {
      if (!token) {
        throw new Error('No authentication token')
      }
      
      const response = await apiService.updateProfile(token, {
        email: profileData.email,
        phone: profileData.phoneNumber,
        whatsapp: profileData.whatsappNumber,
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data && (response.data as any).user) {
        const updatedUser = (response.data as any).user
        setUser(updatedUser)
        
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { AuthContext }

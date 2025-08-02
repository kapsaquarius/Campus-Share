"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
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
  name: string
  phoneNumber: string
  whatsappNumber: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (profileData: ProfileData) => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
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
        const { user, token } = response.data
        setUser(user)
        setToken(token)
        

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        return { success: true }
      }
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
        const { user, token } = response.data
        setUser(user)
        setToken(token)
        

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
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
    console.log("User logged out successfully")
  }

  const updateProfile = async (profileData: ProfileData) => {
    setLoading(true)
    try {
      if (!token) {
        throw new Error('No authentication token')
      }
      
      const response = await apiService.updateProfile(token, {
        name: profileData.name,
        phone: profileData.phoneNumber,
        whatsapp: profileData.whatsappNumber,
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data && response.data.user) {
        const updatedUser = response.data.user
        setUser(updatedUser)
        
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    } finally {
      setLoading(false)
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

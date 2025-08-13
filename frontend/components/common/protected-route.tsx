"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    
    // If not loading and no user, redirect to login
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true)
      router.replace("/auth/login")
    }
  }, [user, loading, router, isRedirecting])

  // Show loading state while auth is being checked
  if (loading) {
    // Check if there's stored auth data to show appropriate message
    const hasStoredAuth = typeof window !== 'undefined' && 
                         localStorage.getItem('token') && 
                         localStorage.getItem('user')
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-base text-gray-600">
            {hasStoredAuth ? "Loading your dashboard..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    )
  }

  // If no user after loading, show redirecting state
  if (!user) {
    return (
          <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="mt-2 text-base text-gray-600">Redirecting to login...</p>
      </div>
    </div>
    )
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

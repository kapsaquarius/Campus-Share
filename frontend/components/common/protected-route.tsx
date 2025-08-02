"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log('ProtectedRoute: Auth state changed - user:', !!user, 'loading:', loading)
    
    // If not loading and no user, redirect to login
    if (!loading && !user && !isRedirecting) {
      console.log('ProtectedRoute: Redirecting to login...')
      setIsRedirecting(true)
      router.replace("/auth/login")
    }
  }, [user, loading, router, isRedirecting])

  // Show loading state while auth is being checked
  if (loading) {
    console.log('ProtectedRoute: Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user after loading, show redirecting state
  if (!user) {
    console.log('ProtectedRoute: No user, showing redirect state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  console.log('ProtectedRoute: User authenticated, rendering protected content')
  // User is authenticated, render the protected content
  return <>{children}</>
}

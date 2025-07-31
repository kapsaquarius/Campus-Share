"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Temporarily disable authentication for testing
  const { user, loading } = useAuth()
  const router = useRouter()

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push("/auth/login")
  //   }
  // }, [user, loading, router])

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   )
  // }

  // if (!user) {
  //   return null
  // }

  return <>{children}</>
}

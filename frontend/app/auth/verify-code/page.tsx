"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, KeyRound, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"

function VerifyCodeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [email, setEmail] = useState("")
  const [codeBlocks, setCodeBlocks] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])

  useEffect(() => {
    const emailParam = searchParams.get("email")
    
    if (!emailParam) {
      // Redirect to login if no email provided (protection against direct access)
      router.push("/auth/login")
      return
    }
    
    setEmail(emailParam)
  }, [searchParams, router])

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1)
    
    const newCodeBlocks = [...codeBlocks]
    newCodeBlocks[index] = digit
    setCodeBlocks(newCodeBlocks)
    
    if (error) setError("")
    
    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !codeBlocks[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((pastedText) => {
        const digits = pastedText.replace(/\D/g, "").slice(0, 6)
        const newCodeBlocks = [...codeBlocks]
        
        for (let i = 0; i < 6; i++) {
          newCodeBlocks[i] = digits[i] || ""
        }
        
        setCodeBlocks(newCodeBlocks)
        
        // Focus the next empty input or the last one
        const nextEmptyIndex = newCodeBlocks.findIndex(block => !block)
        const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5)
        inputRefs.current[focusIndex]?.focus()
      })
    }
  }

  const getCode = () => codeBlocks.join("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const code = getCode()
    
    if (!code) {
      setError("Verification code is required")
      return
    }

    if (code.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await apiService.verifyResetCode(email, code)
      
      if (result.error) {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or has expired. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
        setError("Invalid or expired code")
      } else {
        toast({
          title: "Code Verified",
          description: "Code verified! Please set your new password.",
          duration: 3000,
        })
        
        // Navigate to reset password page with email and code
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
      setError("Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setError("")

    try {
      const result = await apiService.forgotPassword(email)
      
      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to resend verification code. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      } else {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email.",
          duration: 5000,
        })
        setCodeBlocks(["", "", "", "", "", ""]) // Clear existing code
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsResending(false)
    }
  }

  // Show loading while checking email parameter
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="block text-center">Verification Code</Label>
              <div className="flex justify-center gap-3">
                {codeBlocks.map((block, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    value={block}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-xl font-semibold ${
                      error ? "border-red-500" : "border-gray-300"
                    } focus:border-blue-500 focus:ring-blue-500`}
                    maxLength={1}
                    autoComplete="off"
                  />
                ))}
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || getCode().length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyCodeForm />
    </Suspense>
  )
}
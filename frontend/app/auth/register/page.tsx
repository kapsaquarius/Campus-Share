"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Loader2, Check, X, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CountryPhoneInput, validatePhoneNumber } from "@/components/ui/country-phone-input"
import { apiService } from "@/lib/api"

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
  whatsapp: string
  agreeToTerms: boolean
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    whatsapp: "",
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)

  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Debounced email checking function
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(null)
      return
    }

    setEmailChecking(true)
    try {
      const result = await apiService.checkEmailExists(email)
      if (result.data) {
        setEmailExists(result.data.exists)
      }
    } catch (error) {
      console.error("Email check failed:", error)
      setEmailExists(null)
    } finally {
      setEmailChecking(false)
    }
  }, [])

  // Debounce email checking
  useEffect(() => {
    if (formData.email) {
      const timer = setTimeout(() => {
        checkEmailAvailability(formData.email)
      }, 500) // 500ms delay

      return () => clearTimeout(timer)
    } else {
      setEmailExists(null)
    }
  }, [formData.email, checkEmailAvailability])

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    return strength
  }

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 25) return "Weak"
    if (strength < 50) return "Fair"
    if (strength < 75) return "Good"
    return "Strong"
  }

  const validateField = (field: string, value: any, currentFormData = formData) => {
    switch (field) {
      case "username":
        if (!value) return "Username is required"
        if (value.length < 3) return "Username must be at least 3 characters"
        if (value.length > 50) return "Username must be less than 50 characters"
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores"
        return ""

      case "email":
        if (!value) return "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address"
        if (emailExists === true) return "This email address is already registered. Please use a different email."
        return ""

      case "password":
        if (!value) return "Password is required"
        if (value.length < 6) return "Password must be at least 6 characters"
        if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) return "Password must contain at least one letter and one number"
        return ""

      case "confirmPassword":
        if (!value) return "Please confirm your password"
        if (value !== currentFormData.password) return "Passwords do not match"
        return ""

      case "name":
        if (!value) return "Name is required"
        if (value.length < 2) return "Name must be at least 2 characters"
        if (value.length > 100) return "Name must be less than 100 characters"
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces"
        return ""

      case "phone":
        if (!value) return "Phone number is required"
        const phoneValidation = validatePhoneNumber(value)
        return phoneValidation.isValid ? "" : phoneValidation.error || "Invalid phone number"

      case "whatsapp":
        if (!value) return "WhatsApp number is required"
        const whatsappValidation = validatePhoneNumber(value)
        return whatsappValidation.isValid ? "" : whatsappValidation.error || "Invalid WhatsApp number"

      case "agreeToTerms":
        if (!value) return "You must agree to the Terms of Service"
        return ""

      default:
        return ""
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field as keyof FormData])
      if (error) newErrors[field] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
      })
      toast({
        title: "Account created successfully!",
        description: "Welcome to CampusShare!",
        duration: 4000,
      })
      router.push("/rides")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // Real-time validation for the current field
    const error = validateField(field, value, newFormData)
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }))
    } else {
      // Remove error for this field completely
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Special case: if password changes, re-validate confirm password
    if (field === 'password' && newFormData.confirmPassword) {
      const confirmPasswordError = validateField('confirmPassword', newFormData.confirmPassword, newFormData)
      if (confirmPasswordError) {
        setErrors((prev) => ({ ...prev, confirmPassword: confirmPasswordError }))
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.confirmPassword
          return newErrors
        })
      }
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const isFormValid =
    formData.username &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.name &&
    formData.agreeToTerms &&
    Object.keys(errors).length === 0 &&
    emailExists === false && // Email must be available (not exist)
    !emailChecking // Email check must not be in progress

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join CampusShare and connect with fellow students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Choose a username"
                  className={
                    errors.username ? "border-red-500" : formData.username && !errors.username ? "border-green-500" : ""
                  }
                />
                {formData.username && !errors.username && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className={
                    errors.email || emailExists === true 
                      ? "border-red-500" 
                      : formData.email && emailExists === false && !errors.email 
                        ? "border-green-500" 
                        : ""
                  }
                />
                {emailChecking && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 text-blue-500 animate-spin" />
                )}
                {!emailChecking && formData.email && emailExists === false && !errors.email && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {!emailChecking && emailExists === true && (
                  <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              {!errors.email && emailExists === true && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  This email address is already registered. Please use a different email.
                </p>
              )}
              {!errors.email && emailExists === false && formData.email && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Email address is available
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? "border-red-500" : formData.name && !errors.name ? "border-green-500" : ""}
                />
                {formData.name && !errors.name && <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
              </div>
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <CountryPhoneInput
              id="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={(value) => handleInputChange("phone", value)}
              placeholder="Enter phone number"
              error={errors.phone}
              required={true}
              helpText="This will be shared with interested riders to contact you directly"
            />

            <CountryPhoneInput
              id="whatsapp"
              label="WhatsApp Number"
              value={formData.whatsapp}
              onChange={(value) => handleInputChange("whatsapp", value)}
              placeholder="Enter WhatsApp number"
              error={errors.whatsapp}
              required={true}
              helpText="This will be shared with interested riders for WhatsApp communication"
            />

            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a password"
                  className={errors.password ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Progress value={passwordStrength} className="flex-1" />
                    <span className="text-sm text-gray-600">{getPasswordStrengthLabel(passwordStrength)}</span>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  className={
                    errors.confirmPassword
                      ? "border-red-500"
                      : formData.confirmPassword && !errors.confirmPassword
                        ? "border-green-500"
                        : ""
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {formData.confirmPassword && !errors.confirmPassword && (
                  <Check className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link> <span className="text-red-500">*</span>
              </Label>
            </div>
            {errors.agreeToTerms && <p className="text-sm text-red-500">{errors.agreeToTerms}</p>}

            <Button 
              type="submit" 
              className={`w-full ${isFormValid && !isLoading ? 'bg-black hover:bg-gray-800 text-white' : 'bg-gray-300 text-gray-500'}`} 
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 text-blue-600 animate-spin" />
                  Creating your account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

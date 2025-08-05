"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Phone, MessageCircle, Edit, Save, X, Calendar, Mail, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CountryPhoneInput, validatePhoneNumber } from "@/components/ui/country-phone-input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { apiService } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, updateProfile, logout, token } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  // Use actual user data
  const currentUser = user

  const [formData, setFormData] = useState({
    email: currentUser?.email || "",
    phoneNumber: currentUser?.phoneNumber || "",
    whatsappNumber: currentUser?.whatsappNumber || "",
  })

  // Update form data when user data changes (after login or profile update)
  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
        whatsappNumber: currentUser.whatsappNumber || "",
      })
    }
  }, [currentUser])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Real-time validation function
  const validateField = (fieldName: string, value: string) => {
    let error = ""
    
    switch (fieldName) {
      case "email":
        if (!value) {
          error = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address"
        }
        break
      case "phoneNumber":
        if (value) {
          const phoneValidation = validatePhoneNumber(value)
          if (!phoneValidation.isValid) {
            error = phoneValidation.error || "Invalid phone number"
          }
        }
        break
      case "whatsappNumber":
        if (value) {
          const whatsappValidation = validatePhoneNumber(value)
          if (!whatsappValidation.isValid) {
            error = whatsappValidation.error || "Invalid WhatsApp number"
          }
        }
        break
    }
    
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[fieldName] = error
      } else {
        delete newErrors[fieldName]
      }
      return newErrors
    })
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    if (formData.phoneNumber) {
      const phoneValidation = validatePhoneNumber(formData.phoneNumber)
      if (!phoneValidation.isValid) {
        errors.phoneNumber = phoneValidation.error || "Invalid phone number"
      }
    }
    
    if (formData.whatsappNumber) {
      const whatsappValidation = validatePhoneNumber(formData.whatsappNumber)
      if (!whatsappValidation.isValid) {
        errors.whatsappNumber = whatsappValidation.error || "Invalid WhatsApp number"
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return // Button will be disabled, so this won't be called
    }

    setIsLoading(true)
    try {
      if (updateProfile) {
        await updateProfile(formData)
      }
      setIsEditing(false)
      setValidationErrors({})
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
        duration: 4000,
      })
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: "Please try again or contact support.",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      email: currentUser?.email || "",
      phoneNumber: currentUser?.phoneNumber || "",
      whatsappNumber: currentUser?.whatsappNumber || "",
    })
    setValidationErrors({})
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleDeleteAccount = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Please log in to delete your account",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    setIsDeleting(true)
    try {
      const result = await apiService.deleteAccount(token)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
        duration: 5000,
      })

      // Log out and redirect to home page
      logout()
      router.push('/')
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information</p>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
                    {getInitials(currentUser?.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">{currentUser?.name || "User"}</h2>
                  <p className="text-gray-600">@{currentUser?.username || "username"}</p>
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      Member since {currentUser?.createdAt ? format(new Date(currentUser.createdAt), "MMMM yyyy") : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </span>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading || Object.keys(validationErrors).length > 0}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 text-blue-600 animate-spin" />
                          Updating profile...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                                      <Input id="username" value={currentUser?.username || ""} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    {!isEditing ? (
                      <Input id="email" value={currentUser?.email || ""} disabled className="pl-10 bg-gray-50" />
                    ) : (
                      <Input 
                        id="email" 
                        value={formData.email} 
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData((prev) => ({ ...prev, email: value }))
                          validateField("email", value)
                        }}
                        className={`pl-10 ${validationErrors.email ? "border-red-500" : ""}`}
                        placeholder="Enter your email address"
                      />
                    )}
                  </div>
                  {isEditing && (
                    <>
                      {validationErrors.email && <p className="text-sm text-red-500">{validationErrors.email}</p>}
                      <p className="text-xs text-gray-500">Update your email address for account notifications</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={currentUser?.name || ""}
                  disabled
                  className="bg-gray-50"
                  placeholder="No name set"
                />
                <p className="text-xs text-gray-500">Name cannot be changed</p>
              </div>

              <div className="grid sm:grid-cols-1 gap-4">
                {!isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          disabled
                          className="pl-10 bg-gray-50"
                          placeholder="No phone number set"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="whatsappNumber"
                          value={formData.whatsappNumber}
                          disabled
                          className="pl-10 bg-gray-50"
                          placeholder="No WhatsApp number set"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CountryPhoneInput
                      id="phoneNumber"
                      label="Phone Number"
                      value={formData.phoneNumber}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, phoneNumber: value }))
                        validateField("phoneNumber", value)
                      }}
                      placeholder="Enter phone number"
                      error={validationErrors.phoneNumber}
                      helpText="This will be shared with interested riders to contact you directly"
                    />

                    <CountryPhoneInput
                      id="whatsappNumber"
                      label="WhatsApp Number"
                      value={formData.whatsappNumber}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, whatsappNumber: value }))
                        validateField("whatsappNumber", value)
                      }}
                      placeholder="Enter WhatsApp number"
                      error={validationErrors.whatsappNumber}
                      helpText="This will be shared with interested riders for WhatsApp communication"
                    />
                  </>
                )}
              </div>

              {isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your contact information will be shared with other students when you post
                    rides.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Account Created:</span>
                  <p className="font-medium">{currentUser?.createdAt ? format(new Date(currentUser.createdAt), "PPP") : "Unknown"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">{currentUser?.updatedAt ? format(new Date(currentUser.updatedAt), "PPP") : "Unknown"}</p>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="mb-4">
                    <p className="text-sm text-red-800">
                      Once you delete your account, there is no going back. This will permanently delete your account, all your rides, interests, and notifications.
                    </p>
                  </div>
                  
                  <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting Account...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all of your data from our servers, including:
                        <br />
                        <br />
                        • Your account profile
                        <br />
                        • All ride posts you've created
                        <br />
                        • All ride interests you've expressed
                        <br />
                        <br />
                        <strong>This action is irreversible.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, delete my account"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

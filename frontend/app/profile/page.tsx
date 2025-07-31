"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Phone, MessageCircle, Edit, Save, X, Calendar, Mail, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Use actual user data
  const currentUser = user

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    phoneNumber: currentUser?.phoneNumber || "",
    whatsappNumber: currentUser?.whatsappNumber || "",
  })
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (updateProfile) {
        await updateProfile(formData)
      }
      setIsEditing(false)
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      })
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: currentUser?.name || "",
      phoneNumber: currentUser?.phoneNumber || "",
      whatsappNumber: currentUser?.whatsappNumber || "",
    })
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
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
                  <AvatarImage src="/placeholder.svg?height=96&width=96&text=Profile" alt={currentUser?.name || "Profile"} />
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
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
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
                    <Input id="email" value={currentUser?.email || ""} disabled className="pl-10 bg-gray-50" />
                  </div>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      disabled={!isEditing}
                      className={`pl-10 ${!isEditing ? "bg-gray-50" : ""}`}
                      placeholder="+1-555-123-4567"
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                      disabled={!isEditing}
                      className={`pl-10 ${!isEditing ? "bg-gray-50" : ""}`}
                      placeholder="+1-555-123-4567"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your contact information will be shared with other students when you post
                    rides, subleases, or roommate requests.
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
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Home, DollarSign, Upload, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface CreateSubleaseForm {
  location: string
  address: string
  monthlyRent: number
  startDate: Date
  endDate: Date
  moveInTime: string
  moveOutTime: string
  bedrooms: number
  bathrooms: number
  propertyType: string
  amenities: string[]
  description: string
  proximityToCampus: string
}

export default function CreateSubleasePage() {
  const [formData, setFormData] = useState<CreateSubleaseForm>({
    location: "",
    address: "",
    monthlyRent: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    moveInTime: "",
    moveOutTime: "",
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "",
    amenities: [],
    description: "",
    proximityToCampus: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])

  const router = useRouter()
  const { toast } = useToast()

  const propertyTypes = ["Apartment", "House", "Studio", "Condo", "Townhouse", "Room in House", "Room in Apartment"]

  const amenityOptions = [
    "Furnished",
    "Wi-Fi",
    "Parking",
    "Laundry",
    "Gym",
    "Pool",
    "Air Conditioning",
    "Heating",
    "Dishwasher",
    "Balcony",
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.location) newErrors.location = "Location is required"
    if (!formData.address) newErrors.address = "Address is required"
    if (formData.monthlyRent < 100 || formData.monthlyRent > 10000) {
      newErrors.monthlyRent = "Monthly rent must be between $100 and $10,000"
    }
    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = "End date must be after start date"
    }
    if (!formData.propertyType) newErrors.propertyType = "Property type is required"
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Sublease posted successfully!",
      description: "Your sublease is now visible to other students.",
    })

    router.push("/subleases")
    setIsLoading(false)
  }

  const handleInputChange = (field: keyof CreateSubleaseForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      amenities: checked ? [...prev.amenities, amenity] : prev.amenities.filter((a) => a !== amenity),
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + uploadedPhotos.length > 10) {
      toast({
        title: "Too many photos",
        description: "You can upload a maximum of 10 photos.",
        variant: "destructive",
      })
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB.`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    setUploadedPhotos((prev) => [...prev, ...validFiles])
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Sublease</h1>
          <p className="text-gray-600 mt-2">Share your space with fellow students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Tell us about your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Enter city, state"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="monthlyRent"
                      type="number"
                      min="100"
                      max="10000"
                      value={formData.monthlyRent || ""}
                      onChange={(e) => handleInputChange("monthlyRent", Number.parseInt(e.target.value) || 0)}
                      className={`pl-10 ${errors.monthlyRent ? "border-red-500" : ""}`}
                      placeholder="1200"
                    />
                  </div>
                  {errors.monthlyRent && <p className="text-sm text-red-500">{errors.monthlyRent}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Select
                    value={formData.bedrooms.toString()}
                    onValueChange={(value) => handleInputChange("bedrooms", Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Select
                    value={formData.bathrooms.toString()}
                    onValueChange={(value) => handleInputChange("bathrooms", Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleInputChange("propertyType", value)}
                >
                  <SelectTrigger className={errors.propertyType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyType && <p className="text-sm text-red-500">{errors.propertyType}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Dates and Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Availability
              </CardTitle>
              <CardDescription>When is your property available?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && handleInputChange("startDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => date && handleInputChange("endDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="moveInTime">Preferred Move-in Time (Optional)</Label>
                  <Input
                    id="moveInTime"
                    type="time"
                    value={formData.moveInTime}
                    onChange={(e) => handleInputChange("moveInTime", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moveOutTime">Preferred Move-out Time (Optional)</Label>
                  <Input
                    id="moveOutTime"
                    type="time"
                    value={formData.moveOutTime}
                    onChange={(e) => handleInputChange("moveOutTime", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>What amenities does your property offer?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenityOptions.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <Label htmlFor={amenity} className="cursor-pointer">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description and Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Provide more information about your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property, neighborhood, and any special features..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proximityToCampus">Proximity to Campus (Optional)</Label>
                <Input
                  id="proximityToCampus"
                  placeholder="e.g., 10-minute walk to campus"
                  value={formData.proximityToCampus}
                  onChange={(e) => handleInputChange("proximityToCampus", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Photos (Optional, max 10 files, 5MB each)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Drag and drop photos here, or click to select</p>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("photos")?.click()}>
                    Select Photos
                  </Button>
                </div>
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {uploadedPhotos.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setUploadedPhotos((prev) => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting Sublease...
                </>
              ) : (
                "Post Sublease"
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}

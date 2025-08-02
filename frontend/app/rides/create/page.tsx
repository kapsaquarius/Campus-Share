"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { CalendarIcon, Car, MapPin, Clock, Users, DollarSign, Loader2, X } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "@/contexts/location-context"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"
import { TimeInput } from "@/components/ui/time-input"

// Format time from 24h to 12h with AM/PM
const formatTimeRange = (startTime: string, endTime: string) => {
  const formatTime = (time: string) => {
    if (!time) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

interface CreateRideForm {
  startingFrom: string
  goingTo: string
  travelDate: Date
  departureStartTime: string
  departureEndTime: string
  availableSeats: number
  suggestedContribution: number
  currency: string
  additionalDetails: string
}

export default function CreateRidePage() {
  // Helper function to get today's date at midnight (start of day)
  const getTodayStart = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }
  
  const [formData, setFormData] = useState<CreateRideForm>({
    startingFrom: "",
    goingTo: "",
    travelDate: new Date(),
    departureStartTime: "",
    departureEndTime: "",
    availableSeats: 1,
    suggestedContribution: 0,
    currency: "USD",
    additionalDetails: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const { user, token } = useAuth()

  const { popularLocations, searchLocations } = useLocation()

  // Auto-clear time errors when times become valid
  useEffect(() => {
    if (formData.departureStartTime && formData.departureEndTime) {
      const timeToMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const startMinutes = timeToMinutes(formData.departureStartTime);
      const endMinutes = timeToMinutes(formData.departureEndTime);
      
      if (startMinutes <= endMinutes && errors.departureEndTime) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.departureEndTime
          return newErrors
        })
      }
    }
  }, [formData.departureStartTime, formData.departureEndTime, errors.departureEndTime])
  const [startingSuggestions, setStartingSuggestions] = useState<any[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([])
  const [showStartingSuggestions, setShowStartingSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  
  // Track valid selections
  const [validSelections, setValidSelections] = useState({
    startingFrom: false,
    goingTo: false
  })
  
  // Handle input changes with validation
  const handleInputChange = (field: keyof CreateRideForm, value: any) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    // Clear existing error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Real-time validation for time fields
    if (field === 'departureStartTime' || field === 'departureEndTime') {
      const startTime = field === 'departureStartTime' ? value : formData.departureStartTime
      const endTime = field === 'departureEndTime' ? value : formData.departureEndTime
      
      // Helper function to convert time to minutes for comparison
      const timeToMinutes = (timeStr: string) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      if (startTime && endTime) {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (startMinutes > endMinutes) {
          setErrors((prev) => ({ 
            ...prev, 
            departureEndTime: "Latest start time cannot be earlier than earliest start time" 
          }))
        } else {
          // Clear any time-related error for departureEndTime
          setErrors((prev) => {
            const newErrors = { ...prev }
            if (newErrors.departureEndTime && newErrors.departureEndTime.includes("time")) {
              delete newErrors.departureEndTime
            }
            return newErrors
          })
        }
      }
    }
  }

  // Helper function to clear invalid location
  const clearInvalidLocation = (field: "startingFrom" | "goingTo") => {
    handleInputChange(field, "")
    setValidSelections((prev) => ({ ...prev, [field]: false }))
    setStartingSuggestions([])
    setDestinationSuggestions([])
    setShowStartingSuggestions(false)
    setShowDestinationSuggestions(false)
  }
  
  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.travelDate &&
      formData.startingFrom.trim() &&
      formData.goingTo.trim() &&
      formData.departureStartTime &&
      formData.departureEndTime &&
      formData.availableSeats > 0 &&
      Object.keys(errors).length === 0
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.startingFrom) {
      newErrors.startingFrom = "Starting location is required"
    }

    if (!formData.goingTo) {
      newErrors.goingTo = "Destination is required"
    }

    if (formData.startingFrom === formData.goingTo) {
      newErrors.goingTo = "Destination must be different from starting location"
    }

    // Check if travel date is in the past
    if (formData.travelDate < getTodayStart()) {
      newErrors.travelDate = "Travel date cannot be in the past"
    }

    if (!formData.departureStartTime) {
      newErrors.departureStartTime = "Preferred earliest start time is required"
    }

    if (!formData.departureEndTime) {
      newErrors.departureEndTime = "Preferred latest start time is required"
    }

    if (
      formData.departureStartTime &&
      formData.departureEndTime &&
      formData.departureStartTime > formData.departureEndTime
    ) {
      newErrors.departureEndTime = "Latest start time cannot be earlier than earliest start time"
    }

    if (formData.availableSeats < 1 || formData.availableSeats > 8) {
      newErrors.availableSeats = "Available seats must be between 1 and 8"
    }

    if (formData.suggestedContribution < 0 || formData.suggestedContribution > 1000) {
      newErrors.suggestedContribution = "Contribution must be between $0 and $1000"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a ride.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Format data for backend API
      const rideData = {
        startingFrom: formData.startingFrom,
        goingTo: formData.goingTo,
        travelDate: formData.travelDate.getFullYear() + '-' + 
                   String(formData.travelDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(formData.travelDate.getDate()).padStart(2, '0'), // Format as YYYY-MM-DD without timezone conversion
        departureStartTime: formData.departureStartTime,
        departureEndTime: formData.departureEndTime,
        availableSeats: formData.availableSeats,
        suggestedContribution: formData.suggestedContribution,
        currency: "USD",
        additionalDetails: formData.additionalDetails,
      }

      const response = await apiService.createRide(token, rideData)

      if (response.error) {
        toast({
          title: "Failed to create ride",
          description: response.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Ride posted successfully!",
        description: "Your ride has been created and is now visible to other students.",
      })

      router.push("/rides")
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Failed to create ride. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationSearch = async (query: string, field: "startingFrom" | "goingTo") => {
    // Only search if query has at least 2 characters
    if (query.length >= 2) {
      try {
        const locations = await searchLocations(query)
        
        if (field === "startingFrom") {
          setStartingSuggestions(locations)
          setShowStartingSuggestions(true)
          setShowDestinationSuggestions(false)
        } else {
          setDestinationSuggestions(locations)
          setShowDestinationSuggestions(true)
          setShowStartingSuggestions(false)
        }
      } catch (error) {
        console.error('Error searching locations:', error)
        setStartingSuggestions([])
        setDestinationSuggestions([])
      }
    } else {
      setStartingSuggestions([])
      setDestinationSuggestions([])
      setShowStartingSuggestions(false)
      setShowDestinationSuggestions(false)
    }
  }

  const handleLocationSelect = (location: any, field: "startingFrom" | "goingTo") => {
    setFormData((prev) => ({ ...prev, [field]: location.displayName }))
    setValidSelections((prev) => ({ ...prev, [field]: true }))
    setStartingSuggestions([])
    setDestinationSuggestions([])
    setShowStartingSuggestions(false)
    setShowDestinationSuggestions(false)
    // Clear any validation errors for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleLocationInputChange = (value: string, field: "startingFrom" | "goingTo") => {
    // If user is typing but hasn't selected from dropdown, mark as invalid
    setValidSelections((prev) => ({ ...prev, [field]: false }))
    
    // If backspace pressed, clear the field and reset validation
    if (value.length === 0) {
      handleInputChange(field, "")
      setValidSelections((prev) => ({ ...prev, [field]: false }))
      setStartingSuggestions([])
      setDestinationSuggestions([])
      setShowStartingSuggestions(false)
      setShowDestinationSuggestions(false)
      return
    }
    
    // Update form value and trigger search
    handleInputChange(field, value)
    handleLocationSearch(value, field)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a Ride</h1>
          <p className="text-gray-600 mt-2">Share your ride with fellow students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Ride Details
            </CardTitle>
            <CardDescription>Fill out the details for your ride posting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="startingFrom">Starting From <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="startingFrom"
                      placeholder="Enter starting location *"
                      value={formData.startingFrom}
                      onChange={(e) => handleLocationInputChange(e.target.value, "startingFrom")}
                      className={`pl-10 ${errors.startingFrom ? "border-red-500" : ""} ${!validSelections.startingFrom && formData.startingFrom ? "border-amber-500 bg-amber-50" : ""}`}
                      onFocus={() => {
                        if (formData.startingFrom.length >= 2) {
                          handleLocationSearch(formData.startingFrom, "startingFrom")
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowStartingSuggestions(false), 200)
                      }}
                    />
                  </div>
                  {showStartingSuggestions && startingSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto mt-1">
                      {startingSuggestions.map((location, index) => (
                        <div
                          key={location._id}
                          className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                            index === 0 ? 'rounded-t-lg' : ''
                          } ${
                            index === startingSuggestions.length - 1 ? 'rounded-b-lg border-b-0' : 'border-b border-gray-100'
                          }`}
                          onMouseDown={() => handleLocationSelect(location, "startingFrom")}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {location.displayName}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                All areas in {location.city}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.startingFrom && <p className="text-sm text-red-500">{errors.startingFrom}</p>}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="goingTo">Going To <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="goingTo"
                      placeholder="Enter destination *"
                      value={formData.goingTo}
                      onChange={(e) => handleLocationInputChange(e.target.value, "goingTo")}
                      onFocus={() => {
                        if (formData.goingTo.length >= 2) {
                          handleLocationSearch(formData.goingTo, "goingTo")
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowDestinationSuggestions(false), 200)
                      }}
                      className={`pl-10 ${errors.goingTo ? "border-red-500" : ""} ${!validSelections.goingTo && formData.goingTo ? "border-amber-500 bg-amber-50" : ""}`}
                    />
                  </div>
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto mt-1">
                      {destinationSuggestions.map((location, index) => (
                        <div
                          key={location._id}
                          className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                            index === 0 ? 'rounded-t-lg' : ''
                          } ${
                            index === destinationSuggestions.length - 1 ? 'rounded-b-lg border-b-0' : 'border-b border-gray-100'
                          }`}
                          onMouseDown={() => handleLocationSelect(location, "goingTo")}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {location.displayName}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                All areas in {location.city}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.goingTo && <p className="text-sm text-red-500">{errors.goingTo}</p>}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Travel Date <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`flex-1 justify-start text-left font-normal bg-transparent ${errors.travelDate ? "border-red-500 text-red-500" : ""}`}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.travelDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.travelDate}
                          onSelect={(date) => date && handleInputChange("travelDate", date)}
                          disabled={(date) => date < getTodayStart()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                  </div>
                  {errors.travelDate && <p className="text-sm text-red-500">{errors.travelDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departureStartTime">Earliest Start Time<span className="text-red-500">*</span></Label>
                  <TimeInput
                    key="start-time"
                    value={formData.departureStartTime}
                    onChange={(value) => handleInputChange("departureStartTime", value)}
                    placeholder="Earliest departure time *"
                    error={errors.departureStartTime}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departureEndTime">Latest Start Time<span className="text-red-500">*</span></Label>
                  <TimeInput
                    key="end-time"
                    value={formData.departureEndTime}
                    onChange={(value) => {
                      // Clear any existing departureEndTime error first
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.departureEndTime
                        return newErrors
                      })
                      handleInputChange("departureEndTime", value)
                    }}
                    placeholder="Latest departure time"
                    error={errors.departureEndTime}
                    required
                  />
                </div>
              </div>

              {/* Seats and Contribution */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availableSeats">Available Seats</Label>
                  <Select
                    value={formData.availableSeats.toString()}
                    onValueChange={(value) => handleInputChange("availableSeats", Number.parseInt(value))}
                  >
                    <SelectTrigger className={errors.availableSeats ? "border-red-500" : ""}>
                      <Users className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} seat{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.availableSeats && <p className="text-sm text-red-500">{errors.availableSeats}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suggestedContribution">Suggested Contribution</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="suggestedContribution"
                        type="number"
                        min="0"
                        max="1000"
                        value={formData.suggestedContribution === 0 ? "" : formData.suggestedContribution}
                        onChange={(e) =>
                          handleInputChange("suggestedContribution", e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0)
                        }
                        className={`pl-10 ${errors.suggestedContribution ? "border-red-500" : ""}`}
                        placeholder="Enter amount (optional)"
                      />
                                      </div>
                  </div>
                  {errors.suggestedContribution && (
                    <p className="text-sm text-red-500">{errors.suggestedContribution}</p>
                  )}
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
                  <Textarea
                    id="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
                    placeholder="Any additional information about your ride (meeting point, preferences, etc.)"
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.additionalDetails.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Ride Preview</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {formData.startingFrom || "Starting location"} → {formData.goingTo || "Destination"}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(formData.travelDate, "PPP")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formData.departureStartTime && formData.departureEndTime && !errors.departureEndTime
                      ? `Starting between ${formatTimeRange(formData.departureStartTime, formData.departureEndTime)}`
                      : "Preferred time range to be specified"
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {formData.availableSeats} seat{formData.availableSeats === 1 ? '' : 's'}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {formData.suggestedContribution > 0 
                      ? `${formData.suggestedContribution} USD`
                      : "Free"
                    }
                  </div>
                  {formData.additionalDetails && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Additional Details:</p>
                      <p className="text-sm">{formData.additionalDetails}</p>
                    </div>
                  )}
                </div>
              </div>
              {!isFormValid() && !isLoading && (
                <p className="text-sm text-gray-600 text-center">
                  Please fill all required fields (*) to post your ride
                </p>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading || !isFormValid()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Ride...
                    </>
                  ) : (
                    "Post Ride"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

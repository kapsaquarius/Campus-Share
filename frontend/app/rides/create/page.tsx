"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Car, MapPin, Clock, Users, DollarSign, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "@/contexts/location-context"

interface CreateRideForm {
  startingFrom: string
  goingTo: string
  travelDate: Date
  departureStartTime: string
  departureEndTime: string
  availableSeats: number
  suggestedContribution: number
  currency: string
}

export default function CreateRidePage() {
  const [formData, setFormData] = useState<CreateRideForm>({
    startingFrom: "",
    goingTo: "",
    travelDate: new Date(),
    departureStartTime: "",
    departureEndTime: "",
    availableSeats: 1,
    suggestedContribution: 0,
    currency: "USD",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const { popularLocations, searchLocations } = useLocation()
  const [startingSuggestions, setStartingSuggestions] = useState<any[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([])
  const [showStartingSuggestions, setShowStartingSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)

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

    if (!formData.departureStartTime) {
      newErrors.departureStartTime = "Departure start time is required"
    }

    if (!formData.departureEndTime) {
      newErrors.departureEndTime = "Departure end time is required"
    }

    if (
      formData.departureStartTime &&
      formData.departureEndTime &&
      formData.departureStartTime >= formData.departureEndTime
    ) {
      newErrors.departureEndTime = "End time must be after start time"
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

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Ride posted successfully!",
      description: "Your ride has been created and is now visible to other students.",
    })

    router.push("/rides")
    setIsLoading(false)
  }

  const handleInputChange = (field: keyof CreateRideForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleLocationSearch = async (query: string, field: "startingFrom" | "goingTo") => {
    if (query.length > 0) {
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
    setStartingSuggestions([])
    setDestinationSuggestions([])
    setShowStartingSuggestions(false)
    setShowDestinationSuggestions(false)
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
                  <Label htmlFor="startingFrom">Starting From</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="startingFrom"
                      placeholder="Enter starting location"
                      value={formData.startingFrom}
                      onChange={(e) => {
                        handleInputChange("startingFrom", e.target.value)
                        handleLocationSearch(e.target.value, "startingFrom")
                      }}
                      onFocus={() => {
                        if (formData.startingFrom.length > 0) {
                          handleLocationSearch(formData.startingFrom, "startingFrom")
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowStartingSuggestions(false), 200)
                      }}
                      className={`pl-10 ${errors.startingFrom ? "border-red-500" : ""}`}
                    />
                  </div>
                  {showStartingSuggestions && startingSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {startingSuggestions.map((location) => (
                        <div
                          key={location._id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onMouseDown={() => handleLocationSelect(location, "startingFrom")}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{location.displayName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.startingFrom && <p className="text-sm text-red-500">{errors.startingFrom}</p>}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="goingTo">Going To</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="goingTo"
                      placeholder="Enter destination"
                      value={formData.goingTo}
                      onChange={(e) => {
                        handleInputChange("goingTo", e.target.value)
                        handleLocationSearch(e.target.value, "goingTo")
                      }}
                      onFocus={() => {
                        if (formData.goingTo.length > 0) {
                          handleLocationSearch(formData.goingTo, "goingTo")
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowDestinationSuggestions(false), 200)
                      }}
                      className={`pl-10 ${errors.goingTo ? "border-red-500" : ""}`}
                    />
                  </div>
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {destinationSuggestions.map((location) => (
                        <div
                          key={location._id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onMouseDown={() => handleLocationSelect(location, "goingTo")}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{location.displayName}</span>
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
                  <Label>Travel Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.travelDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.travelDate}
                        onSelect={(date) => date && handleInputChange("travelDate", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departureStartTime">Departure Start</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="departureStartTime"
                      type="time"
                      value={formData.departureStartTime}
                      onChange={(e) => handleInputChange("departureStartTime", e.target.value)}
                      className={`pl-10 ${errors.departureStartTime ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.departureStartTime && <p className="text-sm text-red-500">{errors.departureStartTime}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departureEndTime">Departure End</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="departureEndTime"
                      type="time"
                      value={formData.departureEndTime}
                      onChange={(e) => handleInputChange("departureEndTime", e.target.value)}
                      className={`pl-10 ${errors.departureEndTime ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.departureEndTime && <p className="text-sm text-red-500">{errors.departureEndTime}</p>}
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
                        value={formData.suggestedContribution}
                        onChange={(e) =>
                          handleInputChange("suggestedContribution", Number.parseFloat(e.target.value) || 0)
                        }
                        className={`pl-10 ${errors.suggestedContribution ? "border-red-500" : ""}`}
                        placeholder="0"
                      />
                    </div>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.suggestedContribution && (
                    <p className="text-sm text-red-500">{errors.suggestedContribution}</p>
                  )}
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
                    {formData.departureStartTime || "00:00"} - {formData.departureEndTime || "00:00"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {formData.availableSeats} seats available
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />${formData.suggestedContribution} {formData.currency}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
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

"use client"

import React, { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "@/contexts/location-context"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import { apiService } from "@/lib/api"
import { TimeInput } from "@/components/ui/time-input"
import { Car, MapPin, Clock, Users, DollarSign, Phone, CalendarIcon, Search, Plus, MessageSquare, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

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

// Format date string as local date to avoid timezone issues
const formatDate = (dateString: string) => {
  if (!dateString) return dateString;
  
  // Parse date string as local date to avoid timezone issues
  // If dateString is "2025-08-03", we want it to stay August 3rd regardless of timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day); // month is 0-indexed
  
  return format(localDate, "PPP");
};

interface Ride {
  _id: string
  startingFrom: {
    displayName: string
  }
  goingTo: {
    displayName: string
  }
  travelDate: string
  departureStartTime: string
  departureEndTime: string
  availableSeats: number
  seatsRemaining: number
  suggestedContribution: {
    amount: number
    currency: string
  }
  driver: {
    name: string
    phoneNumber: string
    whatsappNumber: string
  }
  interestCount: number
  isHotRide: boolean
  additionalDetails?: string
}

export default function RidesPage() {
  const { user, token } = useAuth()
  const { refreshNotifications } = useNotifications()
  
  // Helper function to get today's date at midnight (start of day)
  const getTodayStart = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }
  const [searchForm, setSearchForm] = useState({
    travelDate: undefined as Date | undefined,
    startingFrom: "",
    goingTo: "",
    preferredTimeStart: "",
    preferredTimeEnd: "",
  })
  const [rides, setRides] = useState<Ride[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [expressingInterest, setExpressingInterest] = useState<string | null>(null)
  const { toast } = useToast()

  const { popularLocations, searchLocations } = useLocation()
  const [startingSuggestions, setStartingSuggestions] = useState<any[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([])
  const [showStartingSuggestions, setShowStartingSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  
  // Track valid selections
  const [validSelections, setValidSelections] = useState({
    startingFrom: false,
    goingTo: false
  })
  
  // Track form validation
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({})
  
  // Helper function to convert time to minutes for comparison
  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Validate time fields
  const validateTimes = (startTime: string, endTime: string) => {
    const errors: Record<string, string> = {}
    
    // Check if only one time is provided (both or neither required)
    if ((startTime && !endTime) || (!startTime && endTime)) {
      if (startTime && !endTime) {
        errors.preferredTimeEnd = "Please provide end time when start time is specified"
      }
      if (!startTime && endTime) {
        errors.preferredTimeStart = "Please provide start time when end time is specified"
      }
    }
    
    // Check if start time is later than end time (only when both are provided)
    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      if (startMinutes > endMinutes) {
        errors.preferredTimeEnd = "End time cannot be earlier than start time"
      }
    }
    
    setTimeErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Check if form is valid
  const isFormValid = () => {
    return (
      searchForm.travelDate &&
      searchForm.startingFrom.trim() &&
      searchForm.goingTo.trim() &&
      validSelections.startingFrom &&
      validSelections.goingTo &&
      Object.keys(timeErrors).length === 0
    )
  }

  // Auto-clear time errors when times become valid
  useEffect(() => {
    if (searchForm.preferredTimeStart && searchForm.preferredTimeEnd) {
      const startMinutes = timeToMinutes(searchForm.preferredTimeStart);
      const endMinutes = timeToMinutes(searchForm.preferredTimeEnd);
      
      if (startMinutes <= endMinutes && timeErrors.preferredTimeEnd) {
        setTimeErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.preferredTimeEnd
          return newErrors
        })
      }
    }
  }, [searchForm.preferredTimeStart, searchForm.preferredTimeEnd, timeErrors.preferredTimeEnd])

  // Don't load rides on mount - show empty state until user searches
  useEffect(() => {
    if (token) {
      // Initialize with empty results
      setRides([])
    }
  }, [token])

  const loadRides = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getRides(token)
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        })
      } else if (response.data && typeof response.data === 'object' && response.data !== null && 'rides' in response.data) {
        setRides((response.data as any).rides || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load rides",
        variant: "destructive",
      })
    }
  }

  // Real location search - no mock data

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
    setSearchForm((prev) => ({ ...prev, [field]: location.displayName }))
    setValidSelections((prev) => ({ ...prev, [field]: true }))
    
    // Clear form errors when valid location is selected
    if (formErrors.length > 0) {
      setFormErrors([])
    }
    
    setStartingSuggestions([])
    setDestinationSuggestions([])
    setShowStartingSuggestions(false)
    setShowDestinationSuggestions(false)
  }

  const handleLocationInputChange = (value: string, field: "startingFrom" | "goingTo") => {
    // If user is typing but hasn't selected from dropdown, mark as invalid
    setValidSelections((prev) => ({ ...prev, [field]: false }))
    
    // If backspace pressed, clear the field and reset validation
    if (value.length === 0) {
      setSearchForm((prev) => ({ ...prev, [field]: "" }))
      setValidSelections((prev) => ({ ...prev, [field]: false }))
      setStartingSuggestions([])
      setDestinationSuggestions([])
      setShowStartingSuggestions(false)
      setShowDestinationSuggestions(false)
      return
    }
    
    // Update form value and trigger search
    setSearchForm((prev) => ({ ...prev, [field]: value }))
    handleLocationSearch(value, field)
  }

  const clearInvalidLocation = (field: "startingFrom" | "goingTo") => {
    setSearchForm((prev) => ({ ...prev, [field]: "" }))
    setValidSelections((prev) => ({ ...prev, [field]: false }))
    setStartingSuggestions([])
    setDestinationSuggestions([])
    setShowStartingSuggestions(false)
    setShowDestinationSuggestions(false)
  }

  const handleSearch = async () => {
    // Validate locations before search
    if (searchForm.startingFrom && !validSelections.startingFrom) {
      clearInvalidLocation("startingFrom")
      toast({
        title: "Invalid starting location",
        description: "Location cleared. Please select a valid location from the dropdown suggestions.",
        variant: "destructive",
      })
      return
    }
    
    if (searchForm.goingTo && !validSelections.goingTo) {
      clearInvalidLocation("goingTo")
      toast({
        title: "Invalid destination",
        description: "Location cleared. Please select a valid location from the dropdown suggestions.", 
        variant: "destructive",
      })
      return
    }

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to search for rides",
        variant: "destructive",
      })
      return
    }

    // Frontend validation - check required fields
    const errors: string[] = []
    
    if (!searchForm.travelDate) {
      errors.push("Travel date is required")
    } else if (searchForm.travelDate < getTodayStart()) {
      errors.push("Travel date cannot be in the past")
    }
    
    if (!searchForm.startingFrom.trim()) {
      errors.push("Starting location is required")
    }
    
    if (!searchForm.goingTo.trim()) {
      errors.push("Destination is required")
    }
    
    if (errors.length > 0) {
      setFormErrors(errors)
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }

    // Clear previous errors since validation passed
    setFormErrors([])
    setIsSearching(true)
    try {
      // Build search parameters from form data
      const searchParams = new URLSearchParams()
      
      if (searchForm.travelDate) {
        searchParams.set('travelDate', format(searchForm.travelDate, 'yyyy-MM-dd'))
      }
      if (searchForm.startingFrom) {
        searchParams.set('startingFrom', searchForm.startingFrom)
      }
      if (searchForm.goingTo) {
        searchParams.set('goingTo', searchForm.goingTo)
      }
      if (searchForm.preferredTimeStart) {
        searchParams.set('preferredTimeStart', searchForm.preferredTimeStart)
      }
      if (searchForm.preferredTimeEnd) {
        searchParams.set('preferredTimeEnd', searchForm.preferredTimeEnd)
      }

      const response = await fetch(`http://localhost:5000/api/rides/search?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      
      // Filter out user's own rides from search results
      const filteredRides = (data.rides || []).filter((ride: any) => {
        return String(ride.userId) !== String(user?._id)
      })
      
      setRides(filteredRides)
      toast({
        title: "Search completed",
        description: `Found ${filteredRides.length} rides for your criteria.`,
      })
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search for rides",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const refreshSearchResults = async () => {
    if (!token || !searchForm.travelDate || !searchForm.startingFrom || !searchForm.goingTo) return
    
    try {
      // Build search parameters from form data (same as handleSearch but without loading state)
      const searchParams = new URLSearchParams()
      
      if (searchForm.travelDate) {
        searchParams.set('travelDate', format(searchForm.travelDate, 'yyyy-MM-dd'))
      }
      if (searchForm.startingFrom) {
        searchParams.set('startingFrom', searchForm.startingFrom)
      }
      if (searchForm.goingTo) {
        searchParams.set('goingTo', searchForm.goingTo)
      }
      if (searchForm.preferredTimeStart) {
        searchParams.set('preferredTimeStart', searchForm.preferredTimeStart)
      }
      if (searchForm.preferredTimeEnd) {
        searchParams.set('preferredTimeEnd', searchForm.preferredTimeEnd)
      }

      const response = await fetch(`http://localhost:5000/api/rides/search?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // Filter out user's own rides from search results
        const filteredRides = (data.rides || []).filter((ride: any) => {
          return String(ride.userId) !== String(user?._id)
        })
        
        setRides(filteredRides)
      }
    } catch (error) {
      // Silently fail - don't show error for background refresh
      console.error('Failed to refresh search results:', error)
    }
  }

  const handleExpressInterest = async (rideId: string) => {
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to express interest",
        variant: "destructive",
      })
      return
    }

    setExpressingInterest(rideId)
    try {
      const response = await apiService.expressInterest(token, rideId)

      if (response && response.error) {
        toast({
          title: "Failed to express interest",
          description: response.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Interest expressed!",
          description: "The driver has been notified! Check 'My Interested Rides' in your profile.",
          duration: 5000,
        })
        
        // Refresh notifications to show any new notifications
        await refreshNotifications()
        
        // Refresh search results quietly without showing loading screen
        await refreshSearchResults()
      }
    } catch (error) {
      toast({
        title: "Failed to express interest",
        description: "An error occurred while expressing interest",
        variant: "destructive",
      })
    } finally {
      setExpressingInterest(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Rides</h1>
          <p className="text-gray-600 mt-2">Search for available rides</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search for Rides
            </CardTitle>
            <CardDescription>Find rides that match your travel plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Travel Date <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`flex-1 justify-start text-left font-normal bg-transparent ${!searchForm.travelDate && formErrors.length > 0 ? "border-red-500 text-red-500" : ""}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchForm.travelDate ? format(searchForm.travelDate, "PPP") : "Select travel date *"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={searchForm.travelDate}
                        onSelect={(date) => {
                          setSearchForm((prev) => ({ ...prev, travelDate: date }))
                          // Clear errors when user selects a date
                          if (date && formErrors.length > 0) {
                            setFormErrors([])
                          }
                        }}
                        disabled={(date) => date < getTodayStart()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {searchForm.travelDate && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSearchForm((prev) => ({ ...prev, travelDate: undefined }))}
                      className="shrink-0"
                      title="Clear date"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label>Starting From <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter starting location *"
                  value={searchForm.startingFrom}
                  onChange={(e) => handleLocationInputChange(e.target.value, "startingFrom")}
                  className={`${!validSelections.startingFrom && searchForm.startingFrom ? "border-amber-500 bg-amber-50" : ""} ${!searchForm.startingFrom.trim() && formErrors.length > 0 ? "border-red-500" : ""}`}
                  onFocus={() => {
                    if (searchForm.startingFrom.length >= 2) {
                      handleLocationSearch(searchForm.startingFrom, "startingFrom")
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for clicks
                    setTimeout(() => setShowStartingSuggestions(false), 200)
                  }}
                />
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
              </div>

              <div className="space-y-2 relative">
                <Label>Going To <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter destination *"
                  value={searchForm.goingTo}
                  onChange={(e) => handleLocationInputChange(e.target.value, "goingTo")}
                  className={`${!validSelections.goingTo && searchForm.goingTo ? "border-amber-500 bg-amber-50" : ""} ${!searchForm.goingTo.trim() && formErrors.length > 0 ? "border-red-500" : ""}`}
                  onFocus={() => {
                    if (searchForm.goingTo.length >= 2) {
                      handleLocationSearch(searchForm.goingTo, "goingTo")
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for clicks
                    setTimeout(() => setShowDestinationSuggestions(false), 200)
                  }}
                />
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
              </div>

              <div className="space-y-2">
                <Label>Preferred Earliest and Latest Start Times</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <TimeInput
                      value={searchForm.preferredTimeStart}
                      onChange={(value) => {
                        setSearchForm((prev) => ({ ...prev, preferredTimeStart: value }))
                        // Validate times when start time changes
                        setTimeout(() => validateTimes(value, searchForm.preferredTimeEnd), 0)
                      }}
                      placeholder="Earliest time"
                      className={timeErrors.preferredTimeStart ? 'border-red-500' : ''}
                      error={timeErrors.preferredTimeStart}
                    />
                  </div>
                  <div className="flex-1">
                    <TimeInput
                      value={searchForm.preferredTimeEnd}
                      onChange={(value) => {
                        setSearchForm((prev) => ({ ...prev, preferredTimeEnd: value }))
                        // Validate times when end time changes
                        setTimeout(() => validateTimes(searchForm.preferredTimeStart, value), 0)
                      }}
                      placeholder="Latest time"
                      className={timeErrors.preferredTimeEnd ? 'border-red-500' : ''}
                      error={timeErrors.preferredTimeEnd}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              className="w-full mt-4" 
              disabled={isSearching || !isFormValid()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Rides
                </>
              )}
            </Button>
            {!isFormValid() && !isSearching && (
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  Please fill all required fields (*) to search for rides
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isSearching && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Searching for rides...</h3>
                  <p className="text-sm text-gray-600">Finding the best matches for your trip</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {rides.length > 0 && !isSearching && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Available Rides</h2>
            {rides.map((ride) => (
              <Card key={ride._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          {ride.startingFrom?.displayName || 'Location not specified'}
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <MapPin className="w-5 h-5 text-green-600" />
                          {ride.goingTo?.displayName || 'Location not specified'}
                        </div>
                        {ride.isHotRide && (
                          <Badge variant="destructive" className="ml-2">
                            🔥 Hot Ride
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDate(ride.travelDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Starting between {formatTimeRange(ride.departureStartTime, ride.departureEndTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {ride.availableSeats} seat{ride.availableSeats === 1 ? '' : 's'}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {ride.suggestedContribution.amount > 0 
                            ? `${ride.suggestedContribution.amount} ${ride.suggestedContribution.currency}`
                            : "Free"
                          }
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Driver: {ride.driver.name}</span>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500">{ride.interestCount} interested</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {ride.additionalDetails && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium mb-1">Additional Details:</p>
                          <p className="text-sm text-blue-800">{ride.additionalDetails}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => handleExpressInterest(ride._id)} 
                        className="flex items-center gap-2"
                        disabled={expressingInterest === ride._id}
                      >
                        {expressingInterest === ride._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Expressing your interest...
                          </>
                        ) : (
                          <>
                            <Car className="w-4 h-4" />
                            Express Interest
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {rides.length === 0 && !isSearching && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rides found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria to find available rides.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}

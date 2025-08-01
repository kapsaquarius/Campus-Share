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
import { Car, MapPin, Clock, Users, DollarSign, Phone, CalendarIcon, Search, Plus, MessageSquare, X } from "lucide-react"
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
}

export default function RidesPage() {
  const { user, token } = useAuth()
  const { refreshNotifications } = useNotifications()
  const [searchForm, setSearchForm] = useState({
    travelDate: undefined as Date | undefined,
    startingFrom: "",
    goingTo: "",
    preferredTimeStart: "",
    preferredTimeEnd: "",
  })
  const [rides, setRides] = useState<Ride[]>([])
  const [isSearching, setIsSearching] = useState(false)
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

    // Frontend validation
    const errors: string[] = []
    
    if (!searchForm.startingFrom.trim()) {
      errors.push("Starting location is required")
    }
    
    if (!searchForm.goingTo.trim()) {
      errors.push("Destination is required")
    }
    
    // Check if travel date is in the past
    if (searchForm.travelDate && searchForm.travelDate < new Date()) {
      errors.push("Travel date cannot be in the past")
    }
    
    // Travel date is optional for search
    
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }

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

  const handleExpressInterest = async (rideId: string) => {
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to express interest",
        variant: "destructive",
      })
      return
    }

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
        
        // Refresh search results to remove the ride from the list
        if (searchForm.travelDate && searchForm.startingFrom && searchForm.goingTo) {
          await handleSearch()
        }
      }
    } catch (error) {
      toast({
        title: "Failed to express interest",
        description: "An error occurred while expressing interest",
        variant: "destructive",
      })
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
                <Label>Travel Date</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchForm.travelDate ? format(searchForm.travelDate, "PPP") : "Select travel date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={searchForm.travelDate}
                        onSelect={(date) => setSearchForm((prev) => ({ ...prev, travelDate: date }))}
                        disabled={(date) => date < new Date()}
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
                <Label>Starting From</Label>
                <Input
                  placeholder="Enter starting location"
                  value={searchForm.startingFrom}
                  onChange={(e) => handleLocationInputChange(e.target.value, "startingFrom")}
                  className={`${!validSelections.startingFrom && searchForm.startingFrom ? "border-amber-500 bg-amber-50" : ""}`}
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
                <Label>Going To</Label>
                <Input
                  placeholder="Enter destination"
                  value={searchForm.goingTo}
                  onChange={(e) => handleLocationInputChange(e.target.value, "goingTo")}
                  className={`${!validSelections.goingTo && searchForm.goingTo ? "border-amber-500 bg-amber-50" : ""}`}
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
                <Label>Preferred Start Times of Travel</Label>
                <div className="flex gap-2">
                  <TimeInput
                    value={searchForm.preferredTimeStart}
                    onChange={(value) => setSearchForm((prev) => ({ ...prev, preferredTimeStart: value }))}
                    placeholder="Start time"
                  />
                  <TimeInput
                    value={searchForm.preferredTimeEnd}
                    onChange={(value) => setSearchForm((prev) => ({ ...prev, preferredTimeEnd: value }))}
                    placeholder="End time"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full mt-4" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search Rides"}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {rides.length > 0 && (
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
                          {format(new Date(ride.travelDate), "PPP")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeRange(ride.departureStartTime, ride.departureEndTime)}
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
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => handleExpressInterest(ride._id)} className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Express Interest
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

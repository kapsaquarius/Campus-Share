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
import { apiService } from "@/lib/api"
import { Car, MapPin, Clock, Users, DollarSign, Phone, CalendarIcon, Search, Plus, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

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
  const [searchForm, setSearchForm] = useState({
    travelDate: new Date(),
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
      } else if (response.data) {
        setRides(response.data.rides || [])
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
    setSearchForm((prev) => ({ ...prev, [field]: location.displayName }))
    setStartingSuggestions([])
    setDestinationSuggestions([])
    setShowStartingSuggestions(false)
    setShowDestinationSuggestions(false)
  }

  const handleSearch = async () => {
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
    
    if (!searchForm.travelDate) {
      errors.push("Travel date is required")
    }
    
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
      const searchParams = new URLSearchParams({
        travelDate: format(searchForm.travelDate, 'yyyy-MM-dd'),
        startingFrom: searchForm.startingFrom,
        goingTo: searchForm.goingTo,
        preferredTimeStart: searchForm.preferredTimeStart,
        preferredTimeEnd: searchForm.preferredTimeEnd,
      })

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
      setRides(data.rides || [])
      toast({
        title: "Search completed",
        description: `Found ${data.rides?.length || 0} rides for your criteria.`,
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
      if (response.error) {
        toast({
          title: "Failed to express interest",
          description: response.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Interest expressed!",
          description: "The driver has been notified of your interest.",
        })
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Rides</h1>
            <p className="text-gray-600 mt-2">Search for available rides or create your own</p>
          </div>
          <Button asChild>
            <Link href="/rides/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Ride
            </Link>
          </Button>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(searchForm.travelDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchForm.travelDate}
                      onSelect={(date) => date && setSearchForm((prev) => ({ ...prev, travelDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 relative">
                <Label>Starting From</Label>
                <Input
                  placeholder="Enter starting location"
                  value={searchForm.startingFrom}
                  onChange={(e) => {
                    setSearchForm((prev) => ({ ...prev, startingFrom: e.target.value }))
                    handleLocationSearch(e.target.value, "startingFrom")
                  }}
                  onFocus={() => {
                    if (searchForm.startingFrom.length > 0) {
                      handleLocationSearch(searchForm.startingFrom, "startingFrom")
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for clicks
                    setTimeout(() => setShowStartingSuggestions(false), 200)
                  }}
                />
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
              </div>

              <div className="space-y-2 relative">
                <Label>Going To</Label>
                <Input
                  placeholder="Enter destination"
                  value={searchForm.goingTo}
                  onChange={(e) => {
                    setSearchForm((prev) => ({ ...prev, goingTo: e.target.value }))
                    handleLocationSearch(e.target.value, "goingTo")
                  }}
                  onFocus={() => {
                    if (searchForm.goingTo.length > 0) {
                      handleLocationSearch(searchForm.goingTo, "goingTo")
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow for clicks
                    setTimeout(() => setShowDestinationSuggestions(false), 200)
                  }}
                />
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
              </div>

              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={searchForm.preferredTimeStart}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, preferredTimeStart: e.target.value }))}
                  />
                  <Input
                    type="time"
                    value={searchForm.preferredTimeEnd}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, preferredTimeEnd: e.target.value }))}
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
                          {ride.departureStartTime} - {ride.departureEndTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {ride.seatsRemaining} of {ride.availableSeats} seats available
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />${ride.suggestedContribution.amount}{" "}
                          {ride.suggestedContribution.currency}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Driver: {ride.driver.name}</span>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500">{ride.interestCount} interested</span>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-600">{ride.driver.phoneNumber}</span>
                              </div>
                              {ride.driver.whatsappNumber && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MessageSquare className="w-4 h-4 text-green-600" />
                                  <span className="text-green-600">{ride.driver.whatsappNumber}</span>
                                </div>
                              )}
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
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or create a new ride posting.</p>
              <Button asChild>
                <Link href="/rides/create">Create a Ride</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}

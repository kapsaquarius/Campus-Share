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
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { useLocation } from "@/contexts/location-context"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"
import { Home, MapPin, CalendarIcon, Bed, Bath, Wifi, CarIcon, Search, Plus, Phone, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Sublease {
  _id: string
  location: {
    displayName: string
  }
  address: string
  monthlyRent: number
  startDate: string
  endDate: string
  bedrooms: number
  bathrooms: number
  propertyType: string
  amenities: string[]
  description: string
  photos: string[]
  proximityToCampus: string
  subleaser: {
    name: string
    phoneNumber: string
    whatsappNumber: string
  }
}

export default function SubleasesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const { popularLocations, searchLocations } = useLocation()
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [searchForm, setSearchForm] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    maxRent: [1500],
    location: "",
    requiredAmenities: [] as string[],
    minBedrooms: 1,
    minBathrooms: 1,
  })
  const [subleases, setSubleases] = useState<Sublease[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Don't load subleases on mount - show empty state until user searches
  useEffect(() => {
    if (token) {
      // Initialize with empty results
      setSubleases([])
    }
  }, [token])

  const loadSubleases = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getSubleases(token)
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        })
      } else if (response.data) {
        setSubleases(response.data.subleases || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subleases",
        variant: "destructive",
      })
    }
  }

  // Real location search - no mock data

  const amenityOptions = [
    { id: "furnished", label: "Furnished", icon: Home },
    { id: "wifi", label: "Wi-Fi", icon: Wifi },
    { id: "parking", label: "Parking", icon: CarIcon },
    { id: "laundry", label: "Laundry", icon: Home },
    { id: "gym", label: "Gym", icon: Home },
    { id: "pool", label: "Pool", icon: Home },
  ]

  const handleLocationSearch = async (query: string) => {
    if (query.length > 0) {
      try {
        const locations = await searchLocations(query)
        setLocationSuggestions(locations)
        setShowLocationSuggestions(true)
      } catch (error) {
        console.error('Error searching locations:', error)
        setLocationSuggestions([])
      }
    } else {
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
    }
  }

  const handleLocationSelect = (location: any) => {
    setSearchForm((prev) => ({ ...prev, location: location.displayName }))
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const handleSearch = async () => {
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to search for subleases",
        variant: "destructive",
      })
      return
    }

    // Frontend validation
    const errors: string[] = []
    
    if (!searchForm.location.trim()) {
      errors.push("Location is required")
    }
    
    if (!searchForm.startDate) {
      errors.push("Start date is required")
    }
    
    if (!searchForm.endDate) {
      errors.push("End date is required")
    }
    
    if (searchForm.maxRent[0] <= 0) {
      errors.push("Maximum rent must be greater than 0")
    }
    
    if (searchForm.minBedrooms <= 0) {
      errors.push("Minimum bedrooms must be at least 1")
    }
    
    if (searchForm.minBathrooms <= 0) {
      errors.push("Minimum bathrooms must be at least 1")
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
      // Build search criteria from form data
      const searchCriteria = {
        startDate: format(searchForm.startDate, 'yyyy-MM-dd'),
        endDate: format(searchForm.endDate, 'yyyy-MM-dd'),
        maxRent: searchForm.maxRent[0],
        location: searchForm.location,
        requiredAmenities: searchForm.requiredAmenities,
        minBedrooms: searchForm.minBedrooms,
        minBathrooms: searchForm.minBathrooms,
      }

      const response = await fetch('http://localhost:5000/api/subleases/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchCriteria),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSubleases(data.subleases || [])
      toast({
        title: "Search completed",
        description: `Found ${data.subleases?.length || 0} subleases for your criteria.`,
      })
    } catch (error) {
      console.error('Error searching subleases:', error)
      toast({
        title: "Search failed",
        description: "Failed to search for subleases",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setSearchForm((prev) => ({
      ...prev,
      requiredAmenities: checked
        ? [...prev.requiredAmenities, amenityId]
        : prev.requiredAmenities.filter((id) => id !== amenityId),
    }))
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Subleases</h1>
            <p className="text-gray-600 mt-2">Discover short-term housing options from fellow students</p>
          </div>
          <Button asChild>
            <Link href="/subleases/create">
              <Plus className="w-4 h-4 mr-2" />
              Post Sublease
            </Link>
          </Button>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search for Subleases
            </CardTitle>
            <CardDescription>Find the perfect temporary housing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(searchForm.startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchForm.startDate}
                      onSelect={(date) => date && setSearchForm((prev) => ({ ...prev, startDate: date }))}
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
                      {format(searchForm.endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchForm.endDate}
                      onSelect={(date) => date && setSearchForm((prev) => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Location and Rent */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label>Location</Label>
                <Input
                  placeholder="Enter location"
                  value={searchForm.location}
                  onChange={(e) => {
                    setSearchForm((prev) => ({ ...prev, location: e.target.value }))
                    handleLocationSearch(e.target.value)
                  }}
                  onFocus={() => {
                    if (searchForm.location.length > 0) {
                      handleLocationSearch(searchForm.location)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowLocationSuggestions(false), 200)
                  }}
                />
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                    {locationSuggestions.map((location) => (
                      <div
                        key={location._id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onMouseDown={() => handleLocationSelect(location)}
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
                <Label>Max Rent: ${searchForm.maxRent[0]}/month</Label>
                <Slider
                  value={searchForm.maxRent}
                  onValueChange={(value) => setSearchForm((prev) => ({ ...prev, maxRent: value }))}
                  max={3000}
                  min={500}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Bedrooms</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={searchForm.minBedrooms === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchForm((prev) => ({ ...prev, minBedrooms: num }))}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Min Bathrooms</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={searchForm.minBathrooms === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchForm((prev) => ({ ...prev, minBathrooms: num }))}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label>Required Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenityOptions.map((amenity) => {
                  const Icon = amenity.icon
                  return (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={searchForm.requiredAmenities.includes(amenity.id)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                      />
                      <Label htmlFor={amenity.id} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="w-4 h-4" />
                        {amenity.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search Subleases"}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {subleases.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Available Subleases</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {subleases.map((sublease) => (
                <Card key={sublease._id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={sublease.photos[0] || "/placeholder.svg"}
                      alt={sublease.address}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-600">${sublease.monthlyRent}/month</Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{sublease.address}</h3>
                        <p className="text-gray-600">{sublease.location?.displayName || 'Location not specified'}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          {sublease.bedrooms} bed
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          {sublease.bathrooms} bath
                        </div>
                        <div className="flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          {sublease.propertyType}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {sublease.proximityToCampus}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {sublease.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {sublease.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{sublease.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-700 text-sm line-clamp-2">{sublease.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex-1">
                          <p className="font-medium">{sublease.subleaser?.name || 'Contact not specified'}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(sublease.startDate), "MMM d")} -{" "}
                            {format(new Date(sublease.endDate), "MMM d, yyyy")}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-600">{sublease.subleaser?.phoneNumber || 'Not provided'}</span>
                            </div>
                            {sublease.subleaser?.whatsappNumber && (
                              <div className="flex items-center gap-2 text-sm">
                                <MessageSquare className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">{sublease.subleaser.whatsappNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {subleases.length === 0 && !isSearching && (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No subleases found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or post your own sublease.</p>
              <Button asChild>
                <Link href="/subleases/create">Post a Sublease</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}

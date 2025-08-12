"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MapPin, Home, DollarSign, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "@/contexts/location-context"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"

interface CreateRoommateForm {
  type: "offer" | "seek"
  location: string
  moveIn: Date | undefined
  budgetRange: [number, number]
  roomType: "private" | "shared"
  furnished: "yes" | "no"
  pets: "ok" | "no"
  smoking: "ok" | "no"
  dietary: "veg" | "non_veg" | "vegan" | "any"
  sleep: "early_bird" | "night_owl" | "flexible" | "any"
  guestsPerWeek: "0" | "1-2" | "3-4" | "5+" | "any"
  additionalDetails: string
  exactAddress?: string
}

export default function CreateRoommatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { token } = useAuth()
  const { searchLocations } = useLocation()

  const [formData, setFormData] = useState<CreateRoommateForm>({
    type: "offer",
    location: "",
    moveIn: undefined,
    budgetRange: [600, 1200],
    roomType: "private",
    furnished: "yes",
    pets: "ok",
    smoking: "no",
    dietary: "any",
    sleep: "any",
    guestsPerWeek: "any",
    additionalDetails: "",
    exactAddress: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [validLocation, setValidLocation] = useState(false)

  // Check if form is valid (required fields only)
  const isFormValid = () => {
    return (
      formData.location.trim().length > 0 &&
      validLocation &&
      !!formData.moveIn &&
      // When offering a room, exact address is required
      (formData.type !== 'offer' || (formData.exactAddress || '').trim().length > 0) &&
      Object.keys(errors).length === 0
    )
  }

  const handleInputChange = (field: keyof CreateRoommateForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.location || !validLocation) newErrors.location = "Please select a valid location"
    if (!formData.moveIn) newErrors.moveIn = "Move-in date is required"
    if (formData.type === 'offer' && !(formData.exactAddress || '').trim()) newErrors.exactAddress = 'Exact address is required when offering a room'
    // No extra validation needed for range slider
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast({ title: "Authentication required", description: "Please log in to create a listing.", variant: "destructive" })
      return
    }
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const payload = {
        type: formData.type,
        location: formData.location,
        moveInEarliest: formData.moveIn ? format(formData.moveIn, "yyyy-MM-dd") : undefined,
        budgetMin: formData.budgetRange[0],
        budgetMax: formData.budgetRange[1],
        roomType: formData.roomType,
        furnished: formData.furnished === "yes",
        petFriendly: formData.pets === "ok",
        smokerOk: formData.smoking === "ok",
        dietaryPreference: formData.dietary === "any" ? undefined : formData.dietary,
        sleepSchedule: formData.sleep === "any" ? undefined : formData.sleep,
        guestsPerWeek: formData.guestsPerWeek === "any" ? undefined : formData.guestsPerWeek,
        additionalDetails: formData.additionalDetails,
        exactAddress: formData.type === 'offer' ? (formData.exactAddress || '').trim() : undefined,
      }
      const response = await apiService.createRoommate(token, payload)
      if (response.error) throw new Error(response.error)
      toast({ title: "Listing posted!", description: "Your roommate listing is now visible." })
      router.push("/roommates")
    } catch (e) {
      toast({ title: "Failed", description: "Could not create listing.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationSearch = async (query: string) => {
    if (query.length >= 2) {
      try {
        const locs = await searchLocations(query)
        setLocationSuggestions(locs)
        setShowLocationSuggestions(true)
      } catch (e) {
        setLocationSuggestions([])
      }
    } else {
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
    }
  }

  // No loader needed per request

  return (
    <ProtectedRoute>
      {initializing ? (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-base text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Roommate Listing</h1>
          <p className="text-gray-600 mt-2">Share your housing need or offer with fellow students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Listing Details
            </CardTitle>
            <CardDescription>Fill out the details for your roommate posting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(v: any) => handleInputChange("type", v)}>
                    <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer">Offering a room</SelectItem>
                      <SelectItem value="seek">Looking for a room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="location">City/Area <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      placeholder="Enter city or area *"
                      value={formData.location}
                      onChange={(e) => {
                        handleInputChange("location", e.target.value)
                        setValidLocation(false)
                        handleLocationSearch(e.target.value)
                      }}
                      className={`pl-10 ${errors.location ? "border-red-500" : ""} ${!validLocation && formData.location ? "border-amber-500 bg-amber-50" : ""}`}
                      onFocus={() => {
                        if (formData.location.length >= 2) {
                          handleLocationSearch(formData.location)
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    />
                  </div>
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto mt-1">
                      {locationSuggestions.map((loc: any) => (
                        <div
                          key={loc._id}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer"
                          onClick={() => {
                            handleInputChange("location", loc.displayName)
                            setValidLocation(true)
                            setLocationSuggestions([])
                            setShowLocationSuggestions(false)
                          }}
                        >
                          <div className="flex items-center gap-2 text-gray-800">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{loc.displayName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moveIn">Move-in <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.moveIn ? format(formData.moveIn, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.moveIn} onSelect={(d) => handleInputChange("moveIn", d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {errors.moveIn && <p className="text-sm text-red-600">{errors.moveIn}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Budget per month</Label>
                  <div className="px-1">
                    <Slider min={0} max={3000} step={50} value={[formData.budgetRange[0], formData.budgetRange[1]]} onValueChange={(v: any) => handleInputChange("budgetRange", v)} />
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1"><DollarSign className="w-4 h-4" /> {formData.budgetRange[0]} - {formData.budgetRange[1]} USD</div>
                </div>

                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={formData.roomType} onValueChange={(v: any) => handleInputChange("roomType", v)}>
                    <SelectTrigger><SelectValue placeholder="Room type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Furnished</Label>
                  <Select value={formData.furnished} onValueChange={(v: any) => handleInputChange("furnished", v)}>
                    <SelectTrigger><SelectValue placeholder="Furnished" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pets</Label>
                  <Select value={formData.pets} onValueChange={(v: any) => handleInputChange("pets", v)}>
                    <SelectTrigger><SelectValue placeholder="Pets" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ok">Pets OK</SelectItem>
                      <SelectItem value="no">No pets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Smoking</Label>
                  <Select value={formData.smoking} onValueChange={(v: any) => handleInputChange("smoking", v)}>
                    <SelectTrigger><SelectValue placeholder="Smoking" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ok">Smoking OK</SelectItem>
                      <SelectItem value="no">No smoking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dietary preference</Label>
                  <Select value={formData.dietary} onValueChange={(v: any) => handleInputChange("dietary", v)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non_veg">Non-vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sleep schedule</Label>
                  <Select value={formData.sleep} onValueChange={(v: any) => handleInputChange("sleep", v)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="early_bird">Early bird</SelectItem>
                      <SelectItem value="night_owl">Night owl</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Guests per week</Label>
                  <Select value={formData.guestsPerWeek} onValueChange={(v: any) => handleInputChange("guestsPerWeek", v)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1-2">1-2</SelectItem>
                      <SelectItem value="3-4">3-4</SelectItem>
                      <SelectItem value="5+">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'offer' && (
                <div className="space-y-2">
                  <Label htmlFor="exactAddress">Exact address <span className="text-red-500">*</span></Label>
                  <Input
                    id="exactAddress"
                    placeholder="Enter the full address of the place"
                    value={formData.exactAddress || ''}
                    onChange={(e) => handleInputChange('exactAddress', e.target.value)}
                    className={errors.exactAddress ? 'border-red-500' : ''}
                  />
                  {errors.exactAddress && <p className="text-sm text-red-600">{errors.exactAddress}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalDetails">Additional Details</Label>
                <Textarea id="additionalDetails" placeholder="Describe the place or your preferences" value={formData.additionalDetails} onChange={(e) => handleInputChange("additionalDetails", e.target.value)} />
              </div>

              {!isFormValid() && !isLoading && (
                <p className="text-sm text-gray-600 text-center">
                  Please fill all required fields (*) to post your listing
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading || !isFormValid()}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Post Listing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      )}
    </ProtectedRoute>
  )
}



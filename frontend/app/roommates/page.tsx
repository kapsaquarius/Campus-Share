"use client"

import React, { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useLocation } from "@/contexts/location-context"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { Users, MapPin, CalendarIcon, DollarSign, Search, X, Loader2, Filter, Home as HomeIcon } from "lucide-react"
import { format } from "date-fns"
import { RoommateCard, type RoommateListing } from "@/components/roommates/RoommateCard"
import { RoommateDetailsModal } from "@/components/roommates/RoommateDetailsModal"

export default function RoommatesPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const { searchLocations } = useLocation()

  const [isSearching, setIsSearching] = useState(false)
  const [listings, setListings] = useState<RoommateListing[]>([])
  const [expressingInterestId, setExpressingInterestId] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: "offer" as "offer" | "seek",
    location: "",
    validLocation: false,
    moveIn: undefined as Date | undefined,
    budget: [400, 1200] as [number, number],
    roomType: "any" as "any" | "private" | "shared",
    furnished: "any" as "any" | "yes" | "no",
    pets: "any" as "any" | "ok" | "no",
    smoking: "any" as "any" | "ok" | "no",
    dietary: "any" as "any" | "veg" | "non_veg" | "vegan",
    sleep: "any" as "any" | "early_bird" | "night_owl" | "flexible",
    guestsPerWeek: "any" as "any" | "0" | "1-2" | "3-4" | "5+",
  })
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  const isFormValid = useMemo(() => {
    return form.location.trim() && form.validLocation
  }, [form.location, form.validLocation])

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

  const handleSearch = async () => {
    if (!token) {
      toast({ title: "Authentication required", description: "Please log in to search for roommates", variant: "destructive" })
      return
    }
    if (!isFormValid) {
      toast({ title: "Validation error", description: "Please select a valid location from suggestions.", variant: "destructive" })
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      // Backend inverts type so that seekers see offers and vice versa
      params.set("type", form.type)
      params.set("location", form.location)
      if (form.moveIn) params.set("moveIn", format(form.moveIn, "yyyy-MM-dd"))
      if (form.budget?.length === 2) {
        params.set("budgetMin", String(form.budget[0]))
        params.set("budgetMax", String(form.budget[1]))
      }
      if (form.roomType !== "any") params.set("roomType", form.roomType)
      if (form.furnished !== "any") params.set("furnished", form.furnished)
      if (form.pets !== "any") params.set("pets", form.pets)
      if (form.smoking !== "any") params.set("smoking", form.smoking)
      if (form.dietary !== "any") params.set("dietary", form.dietary)
      if (form.sleep !== "any") params.set("sleep", form.sleep)
      if (form.guestsPerWeek !== "any") params.set("guestsPerWeek", form.guestsPerWeek)

      const response = await apiService.searchRoommates(token, params)
      if (response.error) throw new Error(response.error)
      const data = (response.data as any) || {}
      setListings((data.listings || []) as RoommateListing[])
      toast({ title: "Search completed", description: `Found ${(data.listings || []).length} listings.` })
    } catch (e) {
      setListings([])
      toast({ title: "Search failed", description: "We could not search at this time.", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const expressInterest = async (id: string) => {
    if (!token) return
    setExpressingInterestId(id)
    try {
      const resp = await apiService.expressRoommateInterest(token, id)
      if (resp.error) throw new Error(resp.error)
      toast({ title: "Interest sent", description: "The poster has been notified." })
      // Remove from current results (parity with rides UX)
      setListings(prev => prev.filter(l => l._id !== id))
    } catch (e) {
      toast({ title: "Failed", description: "Could not send interest.", variant: "destructive" })
    } finally {
      setExpressingInterestId(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Find Roommates</h1>
          <p className="text-gray-600 mt-2">Search roommate listings from fellow students</p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-gray-800"><Filter className="w-4 h-4" /> Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Offering a room</SelectItem>
                    <SelectItem value="seek">Looking for a room</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative">
                <Label>City/Area <span className="text-red-600">*</span></Label>
                <div className="relative">
                  <Input
                    placeholder="Enter city or area"
                    value={form.location}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm((p) => ({ ...p, location: v, validLocation: false }))
                      handleLocationSearch(v)
                    }}
                    onFocus={() => {
                      if (form.location.length >= 2) handleLocationSearch(form.location)
                    }}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    aria-required="true"
                    className={`pl-3 ${!form.validLocation && form.location ? "border-amber-500 bg-amber-50" : ""}`}
                  />
                </div>
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto mt-1">
                    {locationSuggestions.map((loc) => (
                      <div
                        key={loc._id}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setForm((p) => ({ ...p, location: loc.displayName, validLocation: true }))
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
              </div>

              <div className="space-y-2">
                <Label>Move-in</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.moveIn ? format(form.moveIn, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={form.moveIn} onSelect={(d) => setForm((p) => ({ ...p, moveIn: d }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Budget per month</Label>
                <div className="px-1">
                  <Slider min={0} max={3000} step={50} value={[form.budget[0], form.budget[1]]} onValueChange={(v: any) => setForm((p) => ({ ...p, budget: v }))} />
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1"><DollarSign className="w-4 h-4" /> {form.budget[0]} - {form.budget[1]} USD</div>
              </div>

              <div className="space-y-2">
                <Label>Room type</Label>
                <Select value={form.roomType} onValueChange={(v: any) => setForm((p) => ({ ...p, roomType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Furnished</Label>
                <Select value={form.furnished} onValueChange={(v: any) => setForm((p) => ({ ...p, furnished: v }))}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pets</Label>
                <Select value={form.pets} onValueChange={(v: any) => setForm((p) => ({ ...p, pets: v }))}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="ok">Pets OK</SelectItem>
                    <SelectItem value="no">No pets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Smoking</Label>
                <Select value={form.smoking} onValueChange={(v: any) => setForm((p) => ({ ...p, smoking: v }))}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="ok">Smoking OK</SelectItem>
                    <SelectItem value="no">No smoking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dietary preference</Label>
                <Select value={form.dietary} onValueChange={(v: any) => setForm((p) => ({ ...p, dietary: v }))}>
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
                <Select value={form.sleep} onValueChange={(v: any) => setForm((p) => ({ ...p, sleep: v }))}>
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
                <Select value={form.guestsPerWeek} onValueChange={(v: any) => setForm((p) => ({ ...p, guestsPerWeek: v }))}>
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

            <div className="flex justify-end">
              <Button onClick={handleSearch} disabled={!isFormValid || isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />} Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isSearching && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Searching for roommates...</h3>
                  <p className="text-sm text-gray-600">Finding the best matches for your preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {listings.length > 0 && !isSearching && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Available Listings</h2>
            {listings.map((item) => (
              <Card key={item._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <span className="break-words">{(typeof item.location === 'string' ? item.location : (item.location as any)?.displayName) || 'Location not specified'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.moveInEarliest ? `Move-in: ${item.moveInEarliest}` : 'Move-in flexible'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <span>{(item.budgetMin && item.budgetMax) ? `${item.budgetMin}-${item.budgetMax} ${item.currency || 'USD'}/mo` : 'Budget flexible'}</span>
                      </div>
                      {item.roomType && (
                        <div className="flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.roomType}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{item.matchScore ? `Match ${Math.round((item.matchScore || 0) * 100)}%` : 'Recommended'}</span>
                      </div>
                    </div>

                    {item.additionalDetails && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium mb-1">Details:</p>
                        <p className="text-sm text-blue-800 break-words">{item.additionalDetails}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100 flex gap-2 items-center">
                      {/* Show poster name only here (no contact in search results) */}
                      <div className="flex-1">
                        { (item as any).poster?.name ? (
                          <div className="text-sm">
                            <span className="text-gray-600">Poster:</span>{' '}
                            <span className="font-medium text-gray-900">{(item as any).poster.name}</span>
                          </div>
                        ) : null }
                      </div>
                      <Button className="flex-1 sm:flex-none" onClick={() => expressInterest(item._id)} disabled={expressingInterestId === item._id}>
                        {expressingInterestId === item._id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Expressing Interest...
                          </>
                        ) : (
                          <>I'm interested</>
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
        {listings.length === 0 && !isSearching && (
          <Card className="text-center py-12">
            <CardContent>
              <HomeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters to find a better match.</p>
            </CardContent>
          </Card>
        )}

        <RoommateDetailsModal isOpen={!!detailsId} onClose={() => setDetailsId(null)} listingId={detailsId || ""} />
      </div>
    </ProtectedRoute>
  )
}



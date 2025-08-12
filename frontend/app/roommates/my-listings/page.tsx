"use client"

import React, { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { RoommateCard, type RoommateListing } from "@/components/roommates/RoommateCard"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Edit, Trash2, Badge as BadgeIcon, DollarSign, Home, PawPrint, Cigarette, UtensilsCrossed, Moon, MapPin, Users, Loader2 } from "lucide-react"
import { InterestedUsersModal } from "@/components/InterestedUsersModal"
import { format } from "date-fns"
import { useLocation } from "@/contexts/location-context"

export default function MyRoommateListingsPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const { searchLocations } = useLocation()
  const [listings, setListings] = useState<RoommateListing[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [interestedModal, setInterestedModal] = useState<{open:boolean, listingId:string, listingInfo:{ location:string, moveIn:string }}>({open:false, listingId:"", listingInfo:{location:"", moveIn:""}})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [validLocation, setValidLocation] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const resp = await apiService.getMyRoommateListings(token)
        if (resp.error) throw new Error(resp.error)
        const data = (resp.data as any) || {}
        let base = (data.listings || []) as any[]
        // Ensure interestCount reflects current server state by fetching counts per listing
        try {
          const withCounts = await Promise.all(
            base.map(async (l: any) => {
              try {
                const r = await apiService.getRoommateInterestedUsers(token, l._id)
                const cnt = (r.data as any)?.totalCount ?? (r.data as any)?.interestedUsers?.length ?? l.interestCount ?? 0
                return { ...l, interestCount: cnt }
              } catch {
                return { ...l }
              }
            })
          )
          base = withCounts
        } catch {}
        setListings(base as RoommateListing[])
      } catch (e) {
        setListings([])
        toast({ title: "Unable to load", description: "Could not load your listings." })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const formatDate = (date?: string) => {
    if (!date) return ""
    try {
      if (date.includes('T')) {
        const dt = new Date(date)
        return isNaN(dt.getTime()) ? "" : format(dt, 'PPp')
      }
      const [y, m, dRaw] = date.split('-')
      const yNum = Number(y)
      const mNum = Number(m)
      const dNum = Number(dRaw)
      const ld = new Date(yNum, mNum - 1, dNum)
      return isNaN(ld.getTime()) ? "" : format(ld, 'PPP')
    } catch {
      return ""
    }
  }

  const locationLabel = (l: any) => {
    if (!l) return ""
    if (typeof l.location === 'string') return l.location
    return l.location?.displayName || l.neighborhood || l.city || "Location"
  }

  const budgetLabel = (l: any) => {
    const curr = l.currency || 'USD'
    if (l.budgetMin && l.budgetMax) return `${l.budgetMin}-${l.budgetMax} ${curr}/mo`
    if (l.budgetMin) return `${l.budgetMin}+ ${curr}/mo`
    if (l.budgetMax) return `Up to ${l.budgetMax} ${curr}/mo`
    return 'Budget flexible'
  }

  const openEdit = (l: any) => {
    setEditing({
      _id: l._id,
      type: l.type || 'offer',
      location: typeof l.location === 'string' ? l.location : (l.location?.displayName || ''),
      moveInEarliest: l.moveInEarliest || '',
      budgetMin: (l.budgetMin === 0 || l.budgetMin) ? l.budgetMin : '',
      budgetMax: (l.budgetMax === 0 || l.budgetMax) ? l.budgetMax : '',
      roomType: l.roomType || 'private',
      furnished: !!l.furnished,
      petFriendly: !!l.petFriendly,
      smokerOk: !!l.smokerOk,
      dietaryPreference: l.dietaryPreference || 'any',
      sleepSchedule: l.sleepSchedule || 'any',
      guestsPerWeek: l.guestsPerWeek || 'any',
      additionalDetails: l.additionalDetails || '',
    })
    setValidLocation(true)
    setEditErrors({})
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!token || !editing) return
    // simple validation for budget range
    const errors: Record<string, string> = {}
    const minVal = editing.budgetMin === '' ? NaN : Number(editing.budgetMin)
    const maxVal = editing.budgetMax === '' ? NaN : Number(editing.budgetMax)
    if (isNaN(minVal) || isNaN(maxVal)) {
      errors.budgetMissing = 'Please enter values for both minimum and maximum budget'
    } else if (maxVal < minVal) {
      errors.budgetMax = 'Max cannot be smaller than Min'
    }
    if (!editing.location || !validLocation) {
      errors.location = !editing.location ? 'Location is required' : 'Please select a valid location from suggestions'
    }
    setEditErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      setIsUpdating(true)
      const payload = { ...editing, budgetMin: minVal, budgetMax: maxVal }
      const resp = await apiService.updateRoommate(token, editing._id, payload)
      if (resp.error) throw new Error(resp.error)
      toast({ title: 'Updated', description: 'Listing updated successfully.' })
      setEditOpen(false)
      setEditing(null)
      setIsRefreshing(true)
      const reload = await apiService.getMyRoommateListings(token)
      const data = (reload.data as any) || {}
      setListings((data.listings || []) as RoommateListing[])
    } catch (e) {
      toast({ title: 'Failed', description: 'Could not update listing.', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
      setIsRefreshing(false)
    }
  }

  const deleteListing = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const resp = await apiService.deleteRoommate(token, id)
      if (resp.error) throw new Error(resp.error)
      toast({ title: 'Deleted', description: 'Listing deleted.' })
      const reload = await apiService.getMyRoommateListings(token)
      const data = (reload.data as any) || {}
      setListings((data.listings || []) as RoommateListing[])
    } catch (e) {
      toast({ title: 'Failed', description: 'Could not delete listing.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-base text-gray-600">Loading your listings...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">My Roommate Listings</h1>
            {isRefreshing && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">Updating list...</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
          {listings.map((l) => (
            <Card key={l._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span>
                      {l.type === 'offer' ? 'Offering a room' : 'Looking for a room'} — {locationLabel(l)}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Status badge if present */}
                    { (l as any).status && (
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${((l as any).status === 'active') ? 'bg-gray-100 text-gray-800' : 'bg-gray-200 text-gray-700'}`}>
                        {(l as any).status}
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Dialog open={editOpen && editing?._id === l._id} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Listing</DialogTitle>
                          </DialogHeader>
                          {editing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={editing.type} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, type: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="offer">Offering a room</SelectItem>
                                <SelectItem value="seek">Looking for a room</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 relative">
                            <Label>Location <span className="text-red-600">*</span></Label>
                            <div className="relative">
                              <Input
                                value={editing.location}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setEditing((p: any) => ({ ...p, location: v }))
                                  setValidLocation(false)
                                  if (!v) setEditErrors((prev) => ({ ...prev, location: 'Location is required' }))
                                  else setEditErrors((prev) => ({ ...prev, location: '' }))
                                  if (v.length >= 2) {
                                    searchLocations(v).then((locs) => {
                                      setLocationSuggestions(locs)
                                      setShowLocationSuggestions(true)
                                    }).catch(() => setLocationSuggestions([]))
                                  } else {
                                    setLocationSuggestions([])
                                    setShowLocationSuggestions(false)
                                  }
                                }}
                                onFocus={() => {
                                  if (editing.location && editing.location.length >= 2) {
                                    searchLocations(editing.location).then((locs) => {
                                      setLocationSuggestions(locs)
                                      setShowLocationSuggestions(true)
                                    }).catch(() => setLocationSuggestions([]))
                                  }
                                }}
                                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                                className={`${(!validLocation && editing.location) || editErrors.location ? 'border-amber-500 bg-amber-50' : ''}`}
                                placeholder="Enter city or area"
                                aria-required="true"
                              />
                              {showLocationSuggestions && locationSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                                  {locationSuggestions.map((loc: any) => (
                                    <div
                                      key={loc._id}
                                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                      onMouseDown={() => {
                                        setEditing((p: any) => ({ ...p, location: loc.displayName }))
                                        setValidLocation(true)
                                        setEditErrors((prev) => ({ ...prev, location: '' }))
                                        setLocationSuggestions([])
                                        setShowLocationSuggestions(false)
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-900">{loc.displayName}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {editErrors.location && (
                              <p className="text-sm text-red-500 mt-1">{editErrors.location}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Move-in</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editing.moveInEarliest ? formatDate(editing.moveInEarliest) : 'Select date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={editing.moveInEarliest ? new Date(editing.moveInEarliest + 'T12:00:00') : undefined} onSelect={(d) => setEditing((p: any) => ({ ...p, moveInEarliest: d ? format(d, 'yyyy-MM-dd') : '' }))} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>Budget Min</Label>
                            <Input type="number" min={0} value={editing.budgetMin === '' ? '' : editing.budgetMin} onChange={(e) => {
                              const raw = e.target.value
                              const val = raw === '' ? '' : Number(raw)
                              setEditing((p: any) => ({ ...p, budgetMin: val }))
                              setEditErrors((prev) => {
                                const next = { ...prev }
                                const minNum = val === '' ? NaN : Number(val)
                                const maxNum = editing.budgetMax === '' ? NaN : Number(editing.budgetMax)
                                if (isNaN(minNum) || isNaN(maxNum)) next.budgetMissing = 'Please enter values for both minimum and maximum budget'
                                else delete next.budgetMissing
                                if (!isNaN(minNum) && !isNaN(maxNum) && maxNum < minNum) next.budgetMax = 'Max cannot be smaller than Min'
                                else delete next.budgetMax
                                return next
                              })
                            }} />
                            {(editErrors.budgetMissing || editErrors.budgetMax) && (
                              <p className="text-sm text-red-500 mt-1">{editErrors.budgetMax || editErrors.budgetMissing}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Budget Max</Label>
                            <Input type="number" min={0} value={editing.budgetMax === '' ? '' : editing.budgetMax} onChange={(e) => {
                              const raw = e.target.value
                              const val = raw === '' ? '' : Number(raw)
                              setEditing((p: any) => ({ ...p, budgetMax: val }))
                              setEditErrors((prev) => {
                                const next = { ...prev }
                                const minNum = editing.budgetMin === '' ? NaN : Number(editing.budgetMin)
                                const maxNum = val === '' ? NaN : Number(val)
                                if (isNaN(minNum) || isNaN(maxNum)) next.budgetMissing = 'Please enter values for both minimum and maximum budget'
                                else delete next.budgetMissing
                                if (!isNaN(minNum) && !isNaN(maxNum) && maxNum < minNum) next.budgetMax = 'Max cannot be smaller than Min'
                                else delete next.budgetMax
                                return next
                              })
                            }} />
                            {(editErrors.budgetMissing || editErrors.budgetMax) && (
                              <p className="text-sm text-red-500 mt-1">{editErrors.budgetMax || editErrors.budgetMissing}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Room Type</Label>
                            <Select value={editing.roomType} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, roomType: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="shared">Shared</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Furnished</Label>
                            <Select value={editing.furnished ? 'yes' : 'no'} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, furnished: v === 'yes' }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Pets</Label>
                            <Select value={editing.petFriendly ? 'ok' : 'no'} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, petFriendly: v === 'ok' }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">Pets OK</SelectItem>
                                <SelectItem value="no">No pets</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Smoking</Label>
                            <Select value={editing.smokerOk ? 'ok' : 'no'} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, smokerOk: v === 'ok' }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">Smoking OK</SelectItem>
                                <SelectItem value="no">No smoking</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Dietary</Label>
                            <Select value={editing.dietaryPreference || 'any'} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, dietaryPreference: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <Select value={editing.sleepSchedule || 'any'} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, sleepSchedule: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                <SelectItem value="early_bird">Early bird</SelectItem>
                                <SelectItem value="night_owl">Night owl</SelectItem>
                                <SelectItem value="flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Guests per week</Label>
                            <Select value={editing.guestsPerWeek || 'any'} onValueChange={(v: any) => setEditing((p: any) => ({ ...p, guestsPerWeek: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                <SelectItem value="0">None</SelectItem>
                                <SelectItem value="1-2">1-2</SelectItem>
                                <SelectItem value="3-4">3-4</SelectItem>
                                <SelectItem value="5+">5+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Additional details</Label>
                            <Textarea value={editing.additionalDetails} onChange={(e) => setEditing((p: any) => ({ ...p, additionalDetails: e.target.value }))} />
                          </div>
                          <div className="md:col-span-2 flex gap-2 pt-2">
                            <Button onClick={saveEdit} disabled={isUpdating || !!editErrors.budgetMax || !!editErrors.budgetMissing || !!editErrors.location || !validLocation || !editing.location} className="flex-1">
                              {isUpdating ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 text-blue-600 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save'
                              )}
                            </Button>
                            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
                          </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={deletingId === l._id}>
                            {deletingId === l._id ? (
                              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete this roommate listing? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteListing(l._id)} className="bg-red-600 hover:bg-red-700" disabled={deletingId === l._id}>
                              {deletingId === l._id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 text-blue-600 animate-spin" />
                                  Deleting listing...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{l.moveInEarliest ? `Move-in: ${formatDate((l as any).moveInEarliest)}` : 'Move-in flexible'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{budgetLabel(l)}</span>
                  </div>
                  { (l as any).roomType && (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{(l as any).roomType}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs inline-flex items-center rounded px-2 py-0.5 bg-gray-100 text-gray-700">{(l as any).furnished ? 'Furnished' : 'Unfurnished'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{(l as any).petFriendly ? 'Pets OK' : 'No pets'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cigarette className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{(l as any).smokerOk ? 'Smoking OK' : 'No smoking'}</span>
                  </div>
                  { (l as any).dietaryPreference && (
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{(l as any).dietaryPreference === 'veg' ? 'Vegetarian' : (l as any).dietaryPreference === 'non_veg' ? 'Non-vegetarian' : (l as any).dietaryPreference === 'vegan' ? 'Vegan' : 'Any'}</span>
                    </div>
                  )}
                  { (l as any).sleepSchedule && (
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{(l as any).sleepSchedule === 'early_bird' ? 'Early bird' : (l as any).sleepSchedule === 'night_owl' ? 'Night owl' : 'Flexible'}</span>
                    </div>
                  )}
                  { (l as any).guestsPerWeek && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Guests/week: {(l as any).guestsPerWeek}</span>
                    </div>
                  )}
                </div>

                { (l as any).additionalDetails && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Additional Details:</p>
                    <p className="text-sm text-blue-800">{(l as any).additionalDetails}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <button
                      onClick={() => setInterestedModal({
                        open: true,
                        listingId: l._id,
                        listingInfo: { location: locationLabel(l), moveIn: (l as any).moveInEarliest || '' }
                      })}
                      className={`text-sm ${((l as any).interestCount > 0) ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer' : 'text-gray-600 cursor-default'}`}
                      disabled={!((l as any).interestCount > 0)}
                    >
                      {((l as any).interestCount || 0)} {((l as any).interestCount || 0) === 1 ? 'person' : 'people'} interested
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">Posted {formatDate((l as any).createdAt)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          {listings.length === 0 && (
            <Card><CardContent className="p-8 text-center text-gray-600">You have not posted any roommate listings yet.</CardContent></Card>
          )}
          </div>
        </div>
      )}
      <InterestedUsersModal
        isOpen={interestedModal.open}
        onClose={() => setInterestedModal(prev => ({ ...prev, open: false }))}
        rideId={interestedModal.listingId}
        rideInfo={{ startingFrom: interestedModal.listingInfo.location, goingTo: '', travelDate: interestedModal.listingInfo.moveIn || '' }}
        mode="roommate"
      />
    </ProtectedRoute>
  )
}



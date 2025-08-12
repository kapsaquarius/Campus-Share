"use client"

import React, { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { RoommateCard, type RoommateListing } from "@/components/roommates/RoommateCard"
import { Loader2, Users, Heart, Phone, ArrowRight, MapPin, Calendar as CalendarIcon, Clock, DollarSign, HeartOff, Home, PawPrint, Cigarette, UtensilsCrossed, Moon } from "lucide-react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function MyRoommateMatchesPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const resp = await apiService.getMyInterestedRoommates(token)
        if (resp.error) throw new Error(resp.error)
        const data = (resp.data as any) || {}
        setMatches((data.interestedListings || []) as any[])
      } catch (e) {
        setMatches([])
        toast({ title: "Unable to load", description: "Could not load your matches." })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const formatDate = (dateString: string) => {
    try {
      const dateToFormat = dateString?.includes('T') ? new Date(dateString) : new Date(dateString + 'T12:00:00')
      return isNaN(dateToFormat.getTime())
        ? ''
        : dateToFormat.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const handleRemoveInterest = async (listingId?: string) => {
    if (!token || !listingId) return
    try {
      setRemovingId(listingId)
      const resp = await apiService.removeRoommateInterest(token, listingId)
      if (resp.error) {
        toast({ title: "Failed to remove interest", description: resp.error, variant: "destructive" })
        return
      }
      setMatches(prev => prev.filter((it: any) => it.listing?._id !== listingId))
      toast({ title: "Interest removed", description: "You are no longer interested in this listing" })
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove interest", variant: "destructive" })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-base text-gray-600">Loading your matches...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Roommate Interests</h1>
          <p className="text-gray-600 mb-6">Listings you've expressed interest in</p>
          <div className="space-y-3">
            {matches.map((item: any) => (
              <Card key={item._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                          <Heart className="h-3 w-3 mr-1" /> Interested
                        </Badge>
                        {item.interestedAt && (
                          <span className="text-xs text-gray-500">on {formatDate(item.interestedAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Header info */}
                    <div className="flex items-center gap-6 text-lg font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{(typeof item.listing?.location === 'string' ? item.listing?.location : item.listing?.location?.displayName) || ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{item.listing?.type === 'offer' ? 'Offering a room' : 'Looking for a room'}</span>
                      </div>
                    </div>

                    {/* Details grid - show all listing details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {item.listing?.exactAddress && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{item.listing.exactAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span>{item.listing?.moveInEarliest ? formatDate(item.listing.moveInEarliest) : 'Move-in flexible'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>
                          {item.listing?.budgetMin && item.listing?.budgetMax
                            ? `${item.listing.budgetMin}-${item.listing.budgetMax} ${(item.listing.currency || 'USD')}/mo`
                            : item.listing?.budgetMin
                              ? `${item.listing.budgetMin}+ ${(item.listing.currency || 'USD')}/mo`
                              : item.listing?.budgetMax
                                ? `Up to ${item.listing.budgetMax} ${(item.listing.currency || 'USD')}/mo`
                                : 'Budget flexible'}
                        </span>
                      </div>
                      {item.listing?.roomType && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span>{item.listing.roomType}</span>
                        </div>
                      )}
                      {typeof item.listing?.furnished === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs inline-flex items-center rounded px-2 py-0.5 bg-gray-100 text-gray-700">
                            {item.listing.furnished ? 'Furnished' : 'Unfurnished'}
                          </span>
                        </div>
                      )}
                      {typeof item.listing?.petFriendly === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <PawPrint className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{item.listing.petFriendly ? 'Pets OK' : 'No pets'}</span>
                        </div>
                      )}
                      {typeof item.listing?.smokerOk === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <Cigarette className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{item.listing.smokerOk ? 'Smoking OK' : 'No smoking'}</span>
                        </div>
                      )}
                      {item.listing?.dietaryPreference && (
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {item.listing.dietaryPreference === 'veg'
                              ? 'Vegetarian'
                              : item.listing.dietaryPreference === 'non_veg'
                                ? 'Non-vegetarian'
                                : item.listing.dietaryPreference === 'vegan'
                                  ? 'Vegan'
                                  : 'Any'}
                          </span>
                        </div>
                      )}
                      {item.listing?.sleepSchedule && (
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {item.listing.sleepSchedule === 'early_bird'
                              ? 'Early bird'
                              : item.listing.sleepSchedule === 'night_owl'
                                ? 'Night owl'
                                : item.listing.sleepSchedule === 'flexible'
                                  ? 'Flexible'
                                  : 'Any'}
                          </span>
                        </div>
                      )}
                      {item.listing?.guestsPerWeek && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Guests/week: {item.listing.guestsPerWeek}</span>
                        </div>
                      )}
                    </div>

                    {item.listing?.additionalDetails && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium mb-1">Details:</p>
                        <p className="text-sm text-blue-800 break-words">{item.listing?.additionalDetails}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      {/* Poster Details */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Poster Details</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-lg">{item.poster?.name}</span>
                        {item.poster?.username && (
                          <Badge variant="outline" className="text-xs">@{item.poster.username}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {item.poster?.phoneNumber && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md">
                            <Phone className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-mono text-blue-700 select-all">{item.poster.phoneNumber}</span>
                          </div>
                        )}
                        {item.poster?.whatsappNumber && (
                          <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#25D366]/10 rounded-lg border border-[#25D366]/20">
                            <div className="relative flex items-center justify-center w-5 h-5 bg-[#25D366] rounded-full shadow-sm">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.064 3.488"/>
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-[#25D366] select-all">{item.poster.whatsappNumber}</span>
                          </div>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="mr-2 text-red-600 hover:text-red-700"
                            disabled={removingId === item.listing?._id}
                          >
                            {removingId === item.listing?._id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removing...
                              </>
                            ) : (
                              <>
                                <HeartOff className="h-4 w-4 mr-2" /> Not Interested
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Interest</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove your interest in this roommate listing?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveInterest(item.listing?._id)} className="bg-red-600 hover:bg-red-700">
                              Yes, Remove Interest
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {matches.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-600">
                  <Users className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  You haven't expressed interest in any roommate listings yet.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}



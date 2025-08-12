"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Calendar, DollarSign, Home, Phone, UtensilsCrossed, Moon, Users as UsersIcon, PawPrint, Cigarette } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"

interface RoommateDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
}

export function RoommateDetailsModal({ isOpen, onClose, listingId }: RoommateDetailsModalProps) {
  const [listing, setListing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    if (isOpen && listingId && token) {
      fetchDetails()
    }
  }, [isOpen, listingId, token])

  const fetchDetails = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.getRoommate(token, listingId)
      if (response.error) {
        setError(response.error)
      } else {
        setListing(response.data)
      }
    } catch (e) {
      setError("Failed to load listing details")
    } finally {
      setIsLoading(false)
    }
  }

  const locationLabel = listing?.location?.displayName || listing?.neighborhood || listing?.city || "Location"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Roommate Listing</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-base text-gray-600">Loading details...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchDetails} className="mt-4">Try Again</Button>
          </div>
        )}

        {listing && !isLoading && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className={listing.type === "offer" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                    {listing.type === "offer" ? "Offering a room" : "Looking for a room"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{locationLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{listing.moveInEarliest ? `Move-in: ${listing.moveInEarliest}` : "Move-in flexible"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>
                      {listing.budgetMin && listing.budgetMax
                        ? `${listing.budgetMin}-${listing.budgetMax} ${listing.currency || "USD"}/mo`
                        : listing.budgetMin
                        ? `${listing.budgetMin}+ ${listing.currency || "USD"}/mo`
                        : listing.budgetMax
                        ? `Up to ${listing.budgetMax} ${listing.currency || "USD"}/mo`
                        : "Budget flexible"}
                    </span>
                  </div>
                  {listing.exactAddress && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-gray-700">{listing.exactAddress}</span>
                    </div>
                  )}
                  {listing.roomType && (
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-500" />
                      <span>{listing.roomType}</span>
                    </div>
                  )}
                  {typeof listing.furnished === 'boolean' && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 text-gray-500 inline-flex items-center justify-center">🛋️</span>
                      <span>Furnished: {listing.furnished ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {typeof listing.petFriendly === 'boolean' && (
                    <div className="flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-gray-500" />
                      <span>Pets: {listing.petFriendly ? 'OK' : 'Not allowed'}</span>
                    </div>
                  )}
                  {typeof listing.smokerOk === 'boolean' && (
                    <div className="flex items-center gap-2">
                      <Cigarette className="w-4 h-4 text-gray-500" />
                      <span>Smoking: {listing.smokerOk ? 'OK' : 'No'}</span>
                    </div>
                  )}
                  {listing.dietaryPreference && (
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-gray-500" />
                      <span>
                        {listing.dietaryPreference === "veg" ? "Vegetarian" : listing.dietaryPreference === "non_veg" ? "Non-vegetarian" : listing.dietaryPreference === "vegan" ? "Vegan" : "Any"}
                      </span>
                    </div>
                  )}
                  {listing.sleepSchedule && (
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-gray-500" />
                      <span>{listing.sleepSchedule === "early_bird" ? "Early bird" : listing.sleepSchedule === "night_owl" ? "Night owl" : "Flexible"}</span>
                    </div>
                  )}
                  {typeof listing.guestsPerWeek === "number" && (
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-gray-500" />
                      <span>Guests per week: {listing.guestsPerWeek}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {listing.additionalDetails && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Details</h3>
                  <p className="text-gray-700">{listing.additionalDetails}</p>
                </CardContent>
              </Card>
            )}

            {listing.poster && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Posted By</h3>
                  <div className="space-y-2">
                    <div className="font-medium">{listing.poster.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {listing.poster.phoneNumber && (
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-md">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm font-mono text-blue-700 select-all">{listing.poster.phoneNumber}</span>
                        </div>
                      )}
                      {listing.poster.whatsappNumber && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/10 rounded-lg border border-[#25D366]/20">
                          <div className="relative flex items-center justify-center w-6 h-6 bg-[#25D366] rounded-full shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.064 3.488"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[#25D366] select-all">{listing.poster.whatsappNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}



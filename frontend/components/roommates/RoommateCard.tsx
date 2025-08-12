"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, MapPin, Calendar, DollarSign, Home, PawPrint, Cigarette, UtensilsCrossed, Moon } from "lucide-react"

export interface RoommateListing {
  _id: string
  type: "offer" | "seek"
  location?: { displayName?: string } | string
  city?: string
  neighborhood?: string
  exactAddress?: string
  budgetMin?: number
  budgetMax?: number
  currency?: string
  moveInEarliest?: string
  moveOutLatest?: string
  roomType?: string
  furnished?: boolean
  petFriendly?: boolean
  smokerOk?: boolean
  matchScore?: number
  additionalDetails?: string
  interestCount?: number
  dietaryPreference?: "veg" | "non_veg" | "vegan" | "any"
  sleepSchedule?: "early_bird" | "night_owl" | "flexible"
  guestsPerWeek?: number
}

interface RoommateCardProps {
  listing: RoommateListing
  onViewDetails?: (listingId: string) => void
  onExpressInterest?: (listingId: string) => void
  expressingInterestId?: string | null
}

export function RoommateCard({ listing, onViewDetails, onExpressInterest, expressingInterestId }: RoommateCardProps) {
  const locationLabel =
    typeof listing.location === "string"
      ? listing.location
      : listing.location?.displayName || listing.neighborhood || listing.city || "Location"

  const budgetLabel = (() => {
    const curr = listing.currency || "USD"
    if (listing.budgetMin && listing.budgetMax) return `${listing.budgetMin}-${listing.budgetMax} ${curr}/mo`
    if (listing.budgetMin) return `${listing.budgetMin}+ ${curr}/mo`
    if (listing.budgetMax) return `Up to ${listing.budgetMax} ${curr}/mo`
    return "Budget flexible"
  })()

  return (
    <Card className="border border-gray-200 hover:shadow-sm transition overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={listing.type === "offer" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {listing.type === "offer" ? "Offering a room" : "Looking for a room"}
              </Badge>
              {typeof listing.matchScore === "number" && (
                <Badge variant="outline">Match {Math.round(listing.matchScore * 100)}%</Badge>
              )}
              {listing.interestCount ? (
                <Badge variant="outline" className="hidden sm:inline-flex">
                  <Users className="w-3.5 h-3.5 mr-1" /> {listing.interestCount}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-600" /> {locationLabel}</span>
              {listing.exactAddress && (
                <span className="text-gray-700">{listing.exactAddress}</span>
              )}
              {listing.moveInEarliest && (
                <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-500" /> Move-in by {listing.moveInEarliest}</span>
              )}
              <span className="inline-flex items-center gap-1"><DollarSign className="w-4 h-4 text-gray-500" /> {budgetLabel}</span>
              {listing.roomType && (
                <span className="inline-flex items-center gap-1"><Home className="w-4 h-4 text-gray-500" /> {listing.roomType}</span>
              )}
              {listing.furnished && <Badge variant="secondary">Furnished</Badge>}
              {listing.petFriendly && <span className="inline-flex items-center gap-1 text-gray-600"><PawPrint className="w-4 h-4" /> Pets OK</span>}
              {listing.smokerOk && <span className="inline-flex items-center gap-1 text-gray-600"><Cigarette className="w-4 h-4" /> Smoking OK</span>}
              {listing.dietaryPreference && listing.dietaryPreference !== "any" && (
                <span className="inline-flex items-center gap-1 text-gray-600"><UtensilsCrossed className="w-4 h-4" /> {listing.dietaryPreference === "veg" ? "Veg" : listing.dietaryPreference === "non_veg" ? "Non-veg" : "Vegan"}</span>
              )}
              {listing.sleepSchedule && (
                <span className="inline-flex items-center gap-1 text-gray-600"><Moon className="w-4 h-4" /> {listing.sleepSchedule === "early_bird" ? "Early bird" : listing.sleepSchedule === "night_owl" ? "Night owl" : "Flexible"}</span>
              )}
              {typeof listing.guestsPerWeek === "number" && (
                <Badge variant="outline">Guests/wk: {listing.guestsPerWeek}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={() => onViewDetails(listing._id)}>Details</Button>
            )}
            {onExpressInterest && (
              <Button size="sm" onClick={() => onExpressInterest(listing._id)} disabled={expressingInterestId === listing._id}>
                {expressingInterestId === listing._id ? "Sending..." : "I'm interested"}
              </Button>
            )}
          </div>
        </div>

        {listing.additionalDetails && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{listing.additionalDetails}</p>
        )}
      </CardContent>
    </Card>
  )
}



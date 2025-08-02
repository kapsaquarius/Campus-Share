"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Calendar, Clock, Users, DollarSign, Phone, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"
import { format } from "date-fns"

interface RideDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rideId: string
}

interface RideDetails {
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
  seatsRemaining?: number
  suggestedContribution: {
    amount: number
    currency: string
  }
  driver?: {
    name: string
    phoneNumber: string
    whatsappNumber: string
  }
  status: string
  createdAt: string
  updatedAt: string
  interestCount: number
  isHotRide: boolean
  additionalDetails?: string
}

export function RideDetailsModal({ isOpen, onClose, rideId }: RideDetailsModalProps) {
  const [ride, setRide] = useState<RideDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    if (isOpen && rideId && token) {
      fetchRideDetails()
    }
  }, [isOpen, rideId, token])

  const fetchRideDetails = async () => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getRide(token, rideId)
      
      if (response.error) {
        setError(response.error)
      } else {
        setRide(response.data as RideDetails)
      }
    } catch (error) {
      setError("Failed to load ride details")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return time
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return dateString
    
    // Parse date string as local date to avoid timezone issues
    // If dateString is "2025-08-03", we want it to stay August 3rd regardless of timezone
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day) // month is 0-indexed
    
    return format(localDate, "PPP")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ride Details</DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading ride details...</span>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchRideDetails} className="mt-4">
              Try Again
            </Button>
          </div>
        )}
        
        {ride && !isLoading && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {ride.startingFrom?.displayName || 'Location not specified'}
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="w-5 h-5 text-green-600" />
                    {ride.goingTo?.displayName || 'Location not specified'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{formatDate(ride.travelDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Starting between {formatTimeRange(ride.departureStartTime, ride.departureEndTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{ride.availableSeats} seat{ride.availableSeats === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>
                      {ride.suggestedContribution.amount > 0 
                        ? `${ride.suggestedContribution.amount} ${ride.suggestedContribution.currency}`
                        : "Free"
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {ride.additionalDetails && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Additional Details</h3>
                  <p className="text-gray-700">{ride.additionalDetails}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Driver Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{ride.driver?.name || "Unknown Driver"}</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {ride.driver?.phoneNumber && (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-md">
                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-sm font-mono text-blue-700 select-all">
                          {ride.driver.phoneNumber}
                        </span>
                      </div>
                    )}

                    {ride.driver?.whatsappNumber && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/10 rounded-lg border border-[#25D366]/20">
                        <div className="relative flex items-center justify-center w-6 h-6 bg-[#25D366] rounded-full shadow-sm">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.064 3.488"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[#25D366] select-all">
                          {ride.driver.whatsappNumber}
                        </span>
                      </div>
                    )}

                    {(!ride.driver?.phoneNumber && !ride.driver?.whatsappNumber) && (
                      <div className="px-3 py-1.5 bg-gray-100 rounded-md text-center">
                        <p className="text-sm text-gray-500 italic">No contact information available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Status</h3>
                    <Badge variant={ride.status === 'active' ? 'default' : 'secondary'}>
                      {ride.status}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Updated: {format(new Date(ride.updatedAt), "PPp")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
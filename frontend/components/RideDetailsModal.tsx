"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Calendar, Clock, Users, DollarSign, Phone, MessageSquare } from "lucide-react"
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
            {/* Route Information */}
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
                    <span>{format(new Date(ride.travelDate), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{formatTimeRange(ride.departureStartTime, ride.departureEndTime)}</span>
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

            {/* Driver Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Driver Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{ride.driver?.name || "Unknown Driver"}</h4>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-2">
                    {ride.driver?.phoneNumber && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-mono text-blue-800 select-all">
                          {ride.driver.phoneNumber}
                        </span>
                      </div>
                    )}

                    {ride.driver?.whatsappNumber && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                        <MessageSquare className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-mono text-green-800 select-all">
                          {ride.driver.whatsappNumber}
                        </span>
                      </div>
                    )}

                    {(!ride.driver?.phoneNumber && !ride.driver?.whatsappNumber) && (
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-center">
                        <p className="text-sm text-gray-500 italic">No contact information available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ride Status */}
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
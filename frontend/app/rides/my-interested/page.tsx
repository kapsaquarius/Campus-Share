"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Phone, 
  MessageCircle,
  Heart,
  HeartOff,
  ArrowRight,
  Loader2
} from "lucide-react"

interface InterestedRide {
  _id: string
  interestedAt: string
  ride: {
    _id: string
    startingFrom: string
    goingTo: string
    travelDate: string
    departureStartTime: string
    departureEndTime: string
    availableSeats: number
    seatsRemaining: number
    suggestedContribution: number
    status: string
    createdAt: string
    additionalDetails?: string
  }
  driver: {
    name: string
    username: string
    phoneNumber: string
    whatsappNumber: string
  }
}

export default function MyInterestedRidesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [interestedRides, setInterestedRides] = useState<InterestedRide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingInterest, setRemovingInterest] = useState<string | null>(null)

  useEffect(() => {
    if (user && token) {
      fetchInterestedRides()
    }
  }, [user, token])

  const fetchInterestedRides = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiService.getMyInterestedRides(token)
      
      // Handle both direct response and data-wrapped response
      const interestedRidesData = response.data?.interestedRides || response.interestedRides || []
      setInterestedRides(interestedRidesData)
    } catch (error: any) {
      setError(error.message || 'Failed to load interested rides')
      toast({
        title: "Error",
        description: "Failed to load your interested rides",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveInterest = async (rideId: string) => {
    if (!token) return;

    try {
      setRemovingInterest(rideId);
      
      const response = await apiService.removeInterest(token, rideId);
      
      if (response.error) {
        toast({
          title: "Failed to remove interest",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Remove the ride from the local state
      setInterestedRides(prev => prev.filter(item => item.ride._id !== rideId));
      
      toast({
        title: "Interest removed",
        description: "You are no longer interested in this ride",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove interest",
        variant: "destructive",
      });
    } finally {
      setRemovingInterest(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // If the string already contains time info, use it as is
      // Otherwise, add T12:00:00 to avoid timezone issues
      const dateToFormat = dateString.includes('T') 
        ? new Date(dateString)
        : new Date(dateString + 'T12:00:00');
      
      return dateToFormat.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Interested Rides</h1>
        <p className="text-gray-600">Rides you've expressed interest in, with driver contact details</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-gray-600">Loading your interested rides...</span>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-red-500 mb-4">
              <Heart className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Error Loading Rides</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <Button onClick={fetchInterestedRides} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : interestedRides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Heart className="h-16 w-16 mx-auto mb-4 stroke-1" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Interested Rides Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You haven't expressed interest in any rides yet. Browse available rides and show interest to connect with drivers!
              </p>
            </div>
            <Button asChild>
              <a href="/rides">Find Rides</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {interestedRides.map((item) => (
            <Card key={item._id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Ride Route Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        Interested
                      </Badge>
                      <span className="text-xs text-gray-500">
                        on {formatDate(item.interestedAt)}
                      </span>
                    </div>
                    <Badge 
                      variant={item.ride.status === 'active' ? 'default' : 'secondary'}
                      className={item.ride.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {item.ride.status}
                    </Badge>
                  </div>

                  {/* Route Info */}
                  <div className="flex items-center gap-4 text-lg font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{item.ride.startingFrom}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{item.ride.goingTo}</span>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(item.ride.travelDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        Starting between {formatTime(item.ride.departureStartTime)} - {formatTime(item.ride.departureEndTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{item.ride.availableSeats} seat{item.ride.availableSeats === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>{item.ride.suggestedContribution}</span>
                    </div>
                  </div>

                  {item.ride.additionalDetails && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">Additional Details:</p>
                      <p className="text-sm text-blue-800">{item.ride.additionalDetails}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Driver Details Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Driver Details</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-lg">{item.driver.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        @{item.driver.username}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.driver.phoneNumber && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md">
                          <Phone className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-mono text-blue-700 select-all">
                            {item.driver.phoneNumber}
                          </span>
                        </div>
                      )}

                      {item.driver.whatsappNumber && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#25D366]/10 rounded-lg border border-[#25D366]/20">
                          <div className="relative flex items-center justify-center w-5 h-5 bg-[#25D366] rounded-full shadow-sm">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.064 3.488"/>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-[#25D366] select-all">
                            {item.driver.whatsappNumber}
                          </span>
                        </div>
                      )}

                      {!item.driver.phoneNumber && !item.driver.whatsappNumber && (
                        <div className="px-2 py-1 bg-gray-100 rounded-md text-center">
                          <p className="text-xs text-gray-500 italic">No contact information available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          disabled={removingInterest === item.ride._id}
                        >
                          {removingInterest === item.ride._id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <HeartOff className="h-4 w-4 mr-2" />
                              Not Interested
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Interest</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove your interest in this ride from{" "}
                            <strong>{item.ride.startingFrom}</strong> to{" "}
                            <strong>{item.ride.goingTo}</strong>? You can express interest again later if you change your mind.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveInterest(item.ride._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
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
        </div>
      )}
      </div>
    </ProtectedRoute>
  )
}
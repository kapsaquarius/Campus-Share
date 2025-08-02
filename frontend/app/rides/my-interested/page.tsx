"use client"

import { useState, useEffect } from "react"
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
  MessageSquare,
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You need to be logged in to view your interested rides.</p>
      </div>
    )
  }

  return (
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

                  <Separator />

                  {/* Driver Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-lg">{item.driver.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        @{item.driver.username}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {/* Phone Number */}
                      {item.driver.phoneNumber && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <Phone className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-mono text-blue-800 select-all">
                            {item.driver.phoneNumber}
                          </span>
                        </div>
                      )}

                      {/* WhatsApp Number */}
                      {item.driver.whatsappNumber && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                          <MessageSquare className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-mono text-green-800 select-all">
                            {item.driver.whatsappNumber}
                          </span>
                        </div>
                      )}

                      {/* Show message if no contact info */}
                      {!item.driver.phoneNumber && !item.driver.whatsappNumber && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200 text-center">
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
  )
}
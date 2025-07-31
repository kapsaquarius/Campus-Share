"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Heart, X, Phone, MessageCircle, Plus, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"

interface RoommateMatch {
  request: {
    _id: string
    roomPreference: string
    bathroomPreference: string
    dietaryPreference: string
    culturalPreference: string
    petFriendly: boolean
    rentBudget: {
      min: number
      max: number
    }
    aboutMe: string
    lifestyleQuestionnaire: {
      cleanlinessLevel: number
      sleepSchedule: string
      guestFrequency: string
      studyEnvironment: string
    }
  }
  user: {
    name: string
    phoneNumber: string
    whatsappNumber: string
  }
  compatibilityScore: number
  dealBreakers: string[]
}

export default function RoommatesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [matches, setMatches] = useState<RoommateMatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasActiveRequest, setHasActiveRequest] = useState(true) // Set to true for demo

  // Load roommate requests on component mount
  useEffect(() => {
    if (token) {
      loadRoommateRequests()
    }
  }, [token])

  const loadRoommateRequests = async () => {
    if (!token) return
    
    try {
      const response = await apiService.getRoommateRequests(token)
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        })
      } else if (response.data) {
        setMatches(response.data.matches || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load roommate requests",
        variant: "destructive",
      })
    }
  }

  const searchForMatches = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement real roommate matching API
      // For now, just load existing roommate requests
      await loadRoommateRequests()
    } catch (error) {
      console.error('Error searching for matches:', error)
      toast({
        title: "Search failed",
        description: "Failed to search for roommate matches",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePass = (matchId: string) => {
    setMatches((prev) => prev.filter((match) => match.request._id !== matchId))
    toast({
      title: "Match removed",
      description: "This roommate match has been removed from your list.",
    })
  }

  const handleInterested = (matchId: string) => {
    toast({
      title: "Interest expressed!",
      description: "Your interest has been sent to this potential roommate.",
    })
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.8) return "Excellent Match"
    if (score >= 0.6) return "Good Match"
    return "Poor Match"
  }

  const formatPreference = (key: string, value: any) => {
    switch (key) {
      case "roomPreference":
        return `${value} room`
      case "bathroomPreference":
        return `${value} bathroom`
      case "dietaryPreference":
        return value
      case "sleepSchedule":
        return value.replace("_", " ")
      case "guestFrequency":
        return `guests ${value}`
      case "studyEnvironment":
        return `${value} study environment`
      default:
        return value
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Roommates</h1>
            <p className="text-gray-600 mt-2">Connect with compatible living partners</p>
          </div>
          <Button asChild>
            <Link href="/roommates/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Request
            </Link>
          </Button>
        </div>

        {!hasActiveRequest ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No active roommate request</h3>
              <p className="text-gray-600 mb-6">
                Create a roommate request to find compatible living partners based on your preferences and lifestyle.
              </p>
              <div className="space-y-4">
                <Button asChild size="lg">
                  <Link href="/roommates/create">Create Roommate Request</Link>
                </Button>
                <div className="text-sm text-gray-500">
                  <p>Our matching algorithm considers:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <Badge variant="secondary">Sleep schedule</Badge>
                    <Badge variant="secondary">Cleanliness level</Badge>
                    <Badge variant="secondary">Budget range</Badge>
                    <Badge variant="secondary">Lifestyle preferences</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Search Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Find Compatible Roommates</h3>
                    <p className="text-gray-600">Search for roommates based on your preferences</p>
                  </div>
                  <Button onClick={searchForMatches} disabled={isLoading}>
                    {isLoading ? "Searching..." : "Search Matches"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Matches */}
            {matches.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Your Matches</h2>
                <div className="space-y-4">
                  {matches.map((match) => (
                    <Card key={match.request._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {/* Header with compatibility */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">{match.user?.name || 'Name not provided'}</h3>
                                <div className="flex items-center gap-2">
                                  <Progress value={match.compatibilityScore * 100} className="w-24" />
                                  <span
                                    className={`text-sm font-medium ${getCompatibilityColor(match.compatibilityScore)}`}
                                  >
                                    {Math.round(match.compatibilityScore * 100)}% -{" "}
                                    {getCompatibilityLabel(match.compatibilityScore)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-600">{match.user?.phoneNumber || 'Not provided'}</span>
                                  </div>
                                  {match.user?.whatsappNumber && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <MessageCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-green-600">{match.user.whatsappNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Deal Breakers */}
                          {match.dealBreakers.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <h4 className="font-semibold text-red-800">Potential Issues</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {match.dealBreakers.map((issue, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {issue}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* About Me */}
                          <div>
                            <h4 className="font-semibold mb-2">About</h4>
                            <p className="text-gray-700">{match.request.aboutMe}</p>
                          </div>

                          {/* Preferences Grid */}
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-3">Living Preferences</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Room:</span>
                                  <span>{formatPreference("roomPreference", match.request.roomPreference)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Bathroom:</span>
                                  <span>
                                    {formatPreference("bathroomPreference", match.request.bathroomPreference)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Diet:</span>
                                  <span>{match.request.dietaryPreference}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Pets:</span>
                                  <span>{match.request.petFriendly ? "Pet-friendly" : "No pets"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Budget:</span>
                                  <span>
                                    ${match.request.rentBudget.min} - ${match.request.rentBudget.max}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3">Lifestyle</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cleanliness:</span>
                                  <div className="flex items-center gap-2">
                                    <Progress
                                      value={match.request.lifestyleQuestionnaire.cleanlinessLevel * 20}
                                      className="w-16"
                                    />
                                    <span>{match.request.lifestyleQuestionnaire.cleanlinessLevel}/5</span>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Sleep:</span>
                                  <span>
                                    {formatPreference(
                                      "sleepSchedule",
                                      match.request.lifestyleQuestionnaire.sleepSchedule,
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Guests:</span>
                                  <span>
                                    {formatPreference(
                                      "guestFrequency",
                                      match.request.lifestyleQuestionnaire.guestFrequency,
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Study:</span>
                                  <span>
                                    {formatPreference(
                                      "studyEnvironment",
                                      match.request.lifestyleQuestionnaire.studyEnvironment,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t">
                            <Button className="flex-1" onClick={() => handleInterested(match.request._id)}>
                              <Heart className="w-4 h-4 mr-2" />
                              Interested
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 bg-transparent"
                              onClick={() => handlePass(match.request._id)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Pass
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for Matches */}
            {matches.length === 0 && !isLoading && hasActiveRequest && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-600 mb-4">
                    Try searching again or adjust your preferences to find more compatible roommates.
                  </p>
                  <Button onClick={searchForMatches}>Search Again</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

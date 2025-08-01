"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Phone, 
  MessageSquare, 
  Calendar,
  Loader2,
  UserCheck,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

interface InterestedUser {
  _id: string
  createdAt: string
  user: {
    _id: string
    name: string
    username: string
    email: string
    phoneNumber?: string
    whatsappNumber?: string
  }
}

interface InterestedUsersModalProps {
  isOpen: boolean
  onClose: () => void
  rideId: string
  rideInfo: {
    startingFrom: string
    goingTo: string
    travelDate: string
  }
}

export function InterestedUsersModal({ 
  isOpen, 
  onClose, 
  rideId, 
  rideInfo 
}: InterestedUsersModalProps) {
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && rideId && token) {
      fetchInterestedUsers()
    }
  }, [isOpen, rideId, token])

  const fetchInterestedUsers = async () => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getInterestedUsers(token, rideId)
      
      if (response.error) {
        setError(response.error)
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        })
      } else {
        setInterestedUsers(response.data?.interestedUsers || [])
      }
    } catch (error) {
      const errorMsg = "Failed to load interested users"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openWhatsApp = (number: string) => {
    window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank')
  }

  const openPhone = (number: string) => {
    window.open(`tel:${number}`, '_blank')
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interested Riders
          </DialogTitle>
          <DialogDescription>
            People interested in your ride from{' '}
            <span className="font-medium">{rideInfo.startingFrom}</span> to{' '}
            <span className="font-medium">{rideInfo.goingTo}</span> on{' '}
            <span className="font-medium">
              {new Date(rideInfo.travelDate).toLocaleDateString()}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading interested users...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchInterestedUsers} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!isLoading && !error && interestedUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No one has expressed interest yet</p>
              <p className="text-sm text-gray-400">
                Check back later as more people discover your ride!
              </p>
            </div>
          )}

          {!isLoading && !error && interestedUsers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {interestedUsers.length} {interestedUsers.length === 1 ? 'person' : 'people'} interested
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Active Interest
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                {interestedUsers.map((item, index) => (
                  <Card key={item._id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-medium text-lg">{item.user.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              @{item.user.username}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {/* Phone Number */}
                            {item.user.phoneNumber && (
                              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <Phone className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                <span className="text-sm font-mono text-blue-800 select-all">
                                  {item.user.phoneNumber}
                                </span>
                              </div>
                            )}

                            {/* WhatsApp Number */}
                            {item.user.whatsappNumber && (
                              <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                                <MessageSquare className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                <span className="text-sm font-mono text-green-800 select-all">
                                  {item.user.whatsappNumber}
                                </span>
                              </div>
                            )}

                            {/* Show message if no contact info */}
                            {!item.user.phoneNumber && !item.user.whatsappNumber && (
                              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-center">
                                <p className="text-xs text-gray-500 italic">No contact information available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
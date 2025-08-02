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
  MessageCircle, 
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
    if (!dateString) return 'Invalid Date';
    
    // Parse date string as local date to avoid timezone issues
    // If dateString is "2025-08-03", we want it to stay August 3rd regardless of timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              {formatDate(rideInfo.travelDate)}
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
                            {/* Contact Numbers */}
                            <div className="flex flex-wrap gap-2">
                              {item.user.phoneNumber && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md">
                                  <Phone className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-mono text-blue-700 select-all">
                                    {item.user.phoneNumber}
                                  </span>
                                </div>
                              )}
                              {item.user.whatsappNumber && (
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#25D366]/10 rounded-lg border border-[#25D366]/20">
                                  <div className="relative flex items-center justify-center w-5 h-5 bg-[#25D366] rounded-full shadow-sm">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.064 3.488"/>
                                    </svg>
                                  </div>
                                  <span className="text-xs font-medium text-[#25D366] select-all">
                                    {item.user.whatsappNumber}
                                  </span>
                                </div>
                              )}
                            </div>

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
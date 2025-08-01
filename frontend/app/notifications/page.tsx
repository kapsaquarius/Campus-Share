"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/common/protected-route"
import { useNotifications } from "@/contexts/notification-context"
import { RideDetailsModal } from "@/components/RideDetailsModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Car, Home, Check, CheckCheck, Eye } from "lucide-react"
import { format } from "date-fns"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications()
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ride_interest":
      case "ride_update":
      case "ride_cancellation":
        return <Car className="w-5 h-5 text-blue-600" />
      case "sublease_interest":
        return <Home className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const handleViewRideDetails = (notification: any) => {
    if (notification.type === 'ride_update' && notification.relatedId) {
      setSelectedRideId(notification.relatedId)
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  // Only show unread notifications - read notifications are hidden

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">Stay updated with your CampusShare activity</p>
            </div>
            {unreadNotifications.length > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>

          {unreadNotifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
                <p className="text-gray-600">
                  You're all caught up! When you have new activity, it will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Notifications ({unreadNotifications.length})</h2>
                  <div className="space-y-3">
                    {unreadNotifications.map((notification) => (
                      <Card key={notification._id} className="border-l-4 border-l-blue-500 bg-blue-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                  <Badge variant="secondary">New</Badge>
                                </div>
                                <p className="text-gray-700 mb-2">{notification.message}</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(notification.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {notification.type === 'ride_update' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewRideDetails(notification)}
                                  title="View ride details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => markAsRead(notification._id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Read notifications are hidden - only showing unread notifications */}
            </div>
          )}
        </div>
      </div>

      {/* Ride Details Modal */}
      {selectedRideId && (
        <RideDetailsModal
          isOpen={!!selectedRideId}
          onClose={() => setSelectedRideId(null)}
          rideId={selectedRideId}
        />
      )}
    </ProtectedRoute>
  )
}

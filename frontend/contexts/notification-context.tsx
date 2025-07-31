"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface Notification {
  _id: string
  type: "ride_interest" | "ride_update" | "ride_cancellation" | "sublease_interest"
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedId: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  loading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Mock notifications for UI demonstration
  const mockNotifications: Notification[] = [
    {
      _id: "1",
      type: "ride_interest",
      title: "New Ride Interest",
      message: "Sarah Johnson is interested in your ride to Denver Airport",
      isRead: false,
      createdAt: "2024-02-15T10:30:00.000Z",
      relatedId: "ride-1",
    },
    {
      _id: "2",
      type: "sublease_interest",
      title: "Sublease Inquiry",
      message: "Mike Chen sent you a message about your sublease listing",
      isRead: false,
      createdAt: "2024-02-14T15:45:00.000Z",
      relatedId: "sublease-1",
    },
    {
      _id: "3",
      type: "ride_update",
      title: "Ride Confirmed",
      message: "Your ride to Boulder has been confirmed for tomorrow",
      isRead: true,
      createdAt: "2024-02-13T09:15:00.000Z",
      relatedId: "ride-2",
    },
  ]

  useEffect(() => {
    // Load mock notifications
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.isRead).length)
  }, [])

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification._id === id ? { ...notification, isRead: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id: string) => {
    const notification = notifications.find((n) => n._id === id)
    setNotifications((prev) => prev.filter((n) => n._id !== id))

    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

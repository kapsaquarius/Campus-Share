"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { apiService } from "@/lib/api"

interface Notification {
  _id: string
  type: "ride_interest" | "ride_interest_removed" | "ride_update" | "ride_cancellation"
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedId: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  loading: boolean
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user, token } = useAuth()

  const fetchNotifications = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await apiService.getNotifications(token)
      if (response.error) {
        console.error('Error fetching notifications:', response.error)
        return
      }
      const notificationData = (response.data as any)?.notifications || []
      setNotifications(notificationData)
      
      // Fetch unread count
      const unreadResponse = await apiService.getUnreadNotificationCount(token)
      if (unreadResponse.error) {
        console.error('Error fetching unread count:', unreadResponse.error)
        return
      }
      const countData = (unreadResponse.data as any)?.unreadCount || 0
      setUnreadCount(countData)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  useEffect(() => {
    if (user && token) {
      fetchNotifications()
      
      // Set up polling for real-time notifications
      const interval = setInterval(() => {
        // Only fetch if the window is visible (user is actively using the app)
        if (!document.hidden) {
          fetchNotifications()
        }
      }, 30000) // 30 seconds
      
      // Also refresh when window becomes visible (user returns to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchNotifications()
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Cleanup interval and event listener on unmount
      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [user, token])

  const markAsRead = async (id: string) => {
    if (!token) return

    try {
      await apiService.markNotificationAsRead(token, id)
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, read: true } : notification)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return

    try {
      await apiService.markAllNotificationsAsRead(token)
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // deleteNotification removed - notifications are hidden when read

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading,
        refreshNotifications,
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

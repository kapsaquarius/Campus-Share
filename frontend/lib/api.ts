export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Test API connectivity
  async testConnection() {
    return this.request('/health')
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  async register(userData: {
    username: string
    email: string
    password: string
    name: string
    phone: string
    whatsapp: string
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getProfile(token: string) {
    return this.request('/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async updateProfile(token: string, profileData: {
    name?: string
    phone?: string
    whatsapp?: string
  }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    })
  }

  async deleteAccount(token: string) {
    return this.request('/auth/delete-account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  // Rides endpoints
  async getRides(token: string) {
    return this.request('/rides/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async createRide(token: string, rideData: any) {
    return this.request('/rides/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rideData),
    })
  }

  async getRide(token: string, rideId: string) {
    return this.request(`/rides/${rideId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async updateRide(token: string, rideId: string, rideData: any) {
    return this.request(`/rides/${rideId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rideData),
    })
  }

  async deleteRide(token: string, rideId: string) {
    return this.request(`/rides/${rideId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async expressInterest(token: string, rideId: string) {
    return this.request(`/rides/${rideId}/interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async removeInterest(token: string, rideId: string) {
    return this.request(`/rides/${rideId}/interest`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async getInterestedUsers(token: string, rideId: string) {
    return this.request(`/rides/${rideId}/interested-users`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async getMyInterestedRides(token: string) {
    return this.request('/rides/my-interested', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async searchRides(token: string, searchParams: URLSearchParams) {
    return this.request(`/rides/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async getMyRides(token: string) {
    return this.request('/rides/my-rides', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  // Notification endpoints
  async getNotifications(token: string) {
    return this.request('/notifications/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async getUnreadNotificationCount(token: string) {
    return this.request('/notifications/unread-count', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async markNotificationAsRead(token: string, notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async markAllNotificationsAsRead(token: string) {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  // deleteNotification removed - notifications are hidden when read

  // Locations endpoints
  async getLocations(query?: string, limit?: number) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (limit) params.set('limit', limit.toString())
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/locations/search${queryString}`)
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiService = new ApiService() 

# CampusShare API Reference

**Base URL:** `http://localhost:5000/api` (development) or `https://your-domain.com/api` (production)  
**Authentication:** JWT Bearer Token

## 📚 Table of Contents

1. [Authentication](#authentication)
2. [Rides](#rides)
3. [Roommates](#roommates)
4. [Notifications](#notifications)
5. [Locations](#locations)
6. [Common Response Format](#common-response-format)
7. [Error Handling](#error-handling)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@university.edu",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1 5551234567",
  "whatsapp": "+1 5551234567"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "60f3b3b3b3b3b3b3b3b3b3b3",
      "username": "john_doe",
      "email": "john@university.edu",
      "name": "John Doe",
      "phone": "+1 5551234567",
      "whatsapp": "+1 5551234567",
      "createdAt": "2024-12-01T10:30:00Z"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### POST `/auth/login`
Login with username and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60f3b3b3b3b3b3b3b3b3b3b3",
      "username": "john_doe",
      "name": "John Doe",
      "email": "john@university.edu"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### GET `/auth/profile` 🔒
Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60f3b3b3b3b3b3b3b3b3b3b3",
    "username": "john_doe",
    "email": "john@university.edu",
    "name": "John Doe",
    "phone": "+1 5551234567",
    "whatsapp": "+1 5551234567",
    "createdAt": "2024-12-01T10:30:00Z"
  }
}
```

### PUT `/auth/profile` 🔒
Update current user profile.

**Request Body:**
```json
{
  "name": "John Michael Doe",
  "email": "john.doe@university.edu",
  "phone": "+1 5559876543",
  "whatsapp": "+1 5559876543"
}
```

### POST `/auth/forgot-password`
Request password reset code.

**Request Body:**
```json
{
  "email": "john@university.edu"
}
```

### POST `/auth/verify-reset-code`
Verify password reset code.

**Request Body:**
```json
{
  "email": "john@university.edu",
  "code": "123456"
}
```

### POST `/auth/reset-password`
Reset password with verified code.

**Request Body:**
```json
{
  "email": "john@university.edu",
  "code": "123456",
  "newPassword": "newSecurePassword123"
}
```

### POST `/auth/check-email`
Check if email exists in database.

**Request Body:**
```json
{
  "email": "john@university.edu"
}
```

### DELETE `/auth/delete-account` 🔒
Delete current user account and all associated data.

---

## Rides

### GET/POST `/rides/search`
Search for available rides with intelligent filtering.

**Query Parameters (GET) or Request Body (POST):**
```json
{
  "startingFrom": "Boston, MA",
  "goingTo": "New York, NY",
  "travelDate": "2024-12-15",
  "departureTime": "09:00",
  "maxContribution": 50,
  "seatsNeeded": 2,
  "page": 1,
  "limit": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rides": [
      {
        "_id": "60f3b3b3b3b3b3b3b3b3b3b4",
        "startingFrom": "Boston, Massachusetts",
        "goingTo": "New York, New York",
        "travelDate": "2024-12-15",
        "departureStartTime": "08:30",
        "departureEndTime": "09:30",
        "availableSeats": 3,
        "seatsRemaining": 1,
        "suggestedContribution": 45,
        "additionalDetails": "Highway route, no smoking",
        "score": 95.5,
        "driver": {
          "name": "Jane Smith",
          "username": "jane_s",
          "phone": "+1 5551239876",
          "whatsapp": "+1 5551239876"
        },
        "createdAt": "2024-12-01T15:20:00Z"
      }
    ],
    "totalCount": 15,
    "page": 1,
    "hasMore": false
  }
}
```

### GET `/rides/` 🔒
Get all active rides.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rides": [...],
    "total": 25
  }
}
```

### POST `/rides/` 🔒
Create a new ride posting.

**Request Body:**
```json
{
  "startingFrom": "State College, PA",
  "goingTo": "Philadelphia, PA",
  "travelDate": "2024-12-20",
  "departureStartTime": "14:00",
  "departureEndTime": "15:00",
  "availableSeats": 3,
  "suggestedContribution": 35,
  "additionalDetails": "Comfortable SUV, music welcome"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": {
    "_id": "60f3b3b3b3b3b3b3b3b3b3b5",
    "userId": "60f3b3b3b3b3b3b3b3b3b3b3",
    "startingFrom": "State College, PA",
    "goingTo": "Philadelphia, PA",
    "travelDate": "2024-12-20",
    "departureStartTime": "14:00",
    "departureEndTime": "15:00",
    "availableSeats": 3,
    "seatsRemaining": 3,
    "suggestedContribution": 35,
    "additionalDetails": "Comfortable SUV, music welcome",
    "status": "active",
    "createdAt": "2024-12-01T16:45:00Z"
  }
}
```

### GET `/rides/my-rides` 🔒
Get current user's ride postings.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rides": [...],
    "totalCount": 3
  }
}
```

### GET `/rides/my-interested`
Get rides the current user is interested in.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f3b3b3b3b3b3b3b3b3b3b6",
      "interestedAt": "2024-12-01T17:30:00Z",
      "ride": {
        "_id": "60f3b3b3b3b3b3b3b3b3b3b4",
        "startingFrom": "Boston, Massachusetts",
        "goingTo": "New York, New York",
        "travelDate": "2024-12-15",
        "status": "active"
      },
      "driver": {
        "name": "Jane Smith",
        "username": "jane_s",
        "phoneNumber": "+1 5551239876"
      }
    }
  ]
}
```

### GET `/rides/<ride_id>` 🔒
Get detailed information about a specific ride.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60f3b3b3b3b3b3b3b3b3b3b4",
    "startingFrom": "Boston, Massachusetts",
    "goingTo": "New York, New York",
    "travelDate": "2024-12-15",
    "departureStartTime": "08:30",
    "departureEndTime": "09:30",
    "availableSeats": 3,
    "seatsRemaining": 1,
    "suggestedContribution": 45,
    "additionalDetails": "Highway route, no smoking",
    "status": "active",
    "driver": {
      "name": "Jane Smith",
      "username": "jane_s",
      "phone": "+1 5551239876",
      "whatsapp": "+1 5551239876"
    },
    "interestedUsers": [
      {
        "name": "John Doe",
        "username": "john_doe",
        "interestedAt": "2024-12-01T17:30:00Z"
      }
    ],
    "createdAt": "2024-12-01T15:20:00Z"
  }
}
```

### PUT `/rides/<ride_id>` 🔒
Update a ride posting (only by the ride creator).

**Request Body:**
```json
{
  "departureStartTime": "09:00",
  "departureEndTime": "10:00",
  "suggestedContribution": 40,
  "additionalDetails": "Updated: Meeting point changed to main campus gate"
}
```

### DELETE `/rides/<ride_id>` 🔒
Cancel a ride posting (only by the ride creator).

**Response (200):**
```json
{
  "success": true,
  "message": "Ride cancelled successfully"
}
```

### POST `/rides/<ride_id>/interest` 🔒
Express interest in joining a ride.

**Response (200):**
```json
{
  "success": true,
  "message": "Interest added successfully"
}
```

### DELETE `/rides/<ride_id>/interest` 🔒
Remove interest from a ride.

**Response (200):**
```json
{
  "success": true,
  "message": "Interest removed successfully"
}
```

### GET `/rides/<ride_id>/interested-users` 🔒
Get list of users interested in a specific ride (only by ride creator).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "username": "john_doe",
      "phone": "+1 5551234567",
      "whatsapp": "+1 5551234567",
      "interestedAt": "2024-12-01T17:30:00Z"
    }
  ]
}
```

---

## Roommates

### GET `/roommates/search`
Search for roommate listings with preference matching.

**Query Parameters:**
```
?location=State College, PA
&type=seek
&budgetMin=400
&budgetMax=800
&moveIn=2024-12-01
&roomType=single
&furnished=yes
&pets=no
&smoking=no
&dietary=vegetarian
&sleep=early
&guestsPerWeek=2
&page=1
&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "60f3b3b3b3b3b3b3b3b3b3b7",
        "type": "offer",
        "location": "State College, PA",
        "moveInEarliest": "2024-12-01",
        "budgetMin": 500,
        "budgetMax": 700,
        "roomType": "single",
        "furnished": true,
        "petFriendly": false,
        "smokerOk": false,
        "dietaryPreference": "vegetarian",
        "sleepSchedule": "early",
        "guestsPerWeek": 1,
        "additionalDetails": "Quiet study environment, near campus",
        "score": 92.3,
        "poster": {
          "name": "Sarah Johnson",
          "username": "sarah_j",
          "phone": "+1 5551122334",
          "whatsapp": "+1 5551122334"
        },
        "createdAt": "2024-12-01T12:00:00Z"
      }
    ],
    "totalCount": 8,
    "hasMore": false
  }
}
```

### POST `/roommates/` 🔒
Create a new roommate listing.

**Request Body:**
```json
{
  "type": "seek",
  "location": "State College, PA",
  "exactAddress": "123 College Ave",
  "moveInEarliest": "2025-01-15",
  "budgetMin": 400,
  "budgetMax": 800,
  "roomType": "single",
  "furnished": true,
  "petFriendly": false,
  "smokerOk": false,
  "dietaryPreference": "vegetarian",
  "sleepSchedule": "early",
  "guestsPerWeek": 2,
  "additionalDetails": "Graduate student, quiet and clean"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Listing created",
  "data": {
    "listing": {
      "_id": "60f3b3b3b3b3b3b3b3b3b3b8",
      "userId": "60f3b3b3b3b3b3b3b3b3b3b3",
      "type": "seek",
      "location": "State College, PA",
      "moveInEarliest": "2025-01-15",
      "budgetMin": 400,
      "budgetMax": 800,
      "roomType": "single",
      "furnished": true,
      "petFriendly": false,
      "smokerOk": false,
      "dietaryPreference": "vegetarian",
      "sleepSchedule": "early",
      "guestsPerWeek": 2,
      "additionalDetails": "Graduate student, quiet and clean",
      "status": "active",
      "createdAt": "2024-12-01T18:00:00Z"
    }
  }
}
```

### GET `/roommates/my-listings` 🔒
Get current user's roommate listings.

### GET `/roommates/my-matches` 🔒
Get roommate matches based on user's latest listing.

### GET `/roommates/my-interested` 🔒
Get roommate listings the current user is interested in.

### GET `/roommates/<post_id>` 🔒
Get detailed information about a specific roommate listing.

### PUT `/roommates/<post_id>` 🔒
Update a roommate listing (only by the listing creator).

### DELETE `/roommates/<post_id>` 🔒
Delete a roommate listing (only by the listing creator).

### POST `/roommates/<post_id>/interest` 🔒
Express interest in a roommate listing.

### DELETE `/roommates/<post_id>/interest` 🔒
Remove interest from a roommate listing.

### GET `/roommates/<post_id>/interested-users` 🔒
Get list of users interested in a specific listing (only by listing creator).

---

## Notifications

### GET `/notifications/` 🔒
Get current user's notifications.

**Query Parameters:**
```
?page=1&limit=20&unread=true
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "60f3b3b3b3b3b3b3b3b3b3b9",
        "type": "ride_interest",
        "title": "New Ride Interest",
        "message": "John Doe is interested in your ride from State College, PA to Philadelphia, PA",
        "relatedId": "60f3b3b3b3b3b3b3b3b3b3b5",
        "read": false,
        "createdAt": "2024-12-01T19:30:00Z"
      },
      {
        "_id": "60f3b3b3b3b3b3b3b3b3b3ba",
        "type": "roommate_update",
        "title": "Roommate Listing Updated",
        "message": "A roommate listing you are interested in has been updated",
        "relatedId": "60f3b3b3b3b3b3b3b3b3b3b7",
        "read": true,
        "createdAt": "2024-12-01T18:45:00Z"
      }
    ]
  }
}
```

### GET `/notifications/unread-count` 🔒
Get count of unread notifications.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### PUT `/notifications/<notification_id>/read` 🔒
Mark a specific notification as read.

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### PUT `/notifications/mark-all-read` 🔒
Mark all notifications as read.

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Locations

### GET `/locations/`
Get all locations (limited to 100 results).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "_id": "60f3b3b3b3b3b3b3b3b3b3bb",
        "zipCode": "16801",
        "city": "University Park",
        "state": "PA",
        "stateName": "Pennsylvania",
        "displayName": "University Park, PA",
        "createdAt": "2024-12-01T10:00:00Z"
      }
    ],
    "total": 100
  }
}
```

### GET `/locations/search`
Search locations for autocomplete.

**Query Parameters:**
```
?q=state college&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f3b3b3b3b3b3b3b3b3b3bb",
      "zipCode": "16801",
      "city": "University Park",
      "state": "PA",
      "stateName": "Pennsylvania",
      "displayName": "University Park, PA"
    },
    {
      "_id": "60f3b3b3b3b3b3b3b3b3b3bc",
      "zipCode": "16802",
      "city": "State College",
      "state": "PA",
      "stateName": "Pennsylvania",
      "displayName": "State College, PA"
    }
  ]
}
```

### GET `/locations/<location_id>`
Get a specific location by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60f3b3b3b3b3b3b3b3b3b3bb",
    "zipCode": "16801",
    "city": "University Park",
    "state": "PA",
    "stateName": "Pennsylvania",
    "displayName": "University Park, PA",
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

---

## Common Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE", // Optional error code
  "details": {} // Optional additional error details
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side errors |

### Common Error Examples

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Missing required fields: startingFrom, goingTo"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Ride not found"
}
```

**422 Unprocessable Entity:**
```json
{
  "success": false,
  "error": "Invalid email format",
  "details": {
    "field": "email",
    "value": "invalid-email"
  }
}
```

---

## CORS

The API supports Cross-Origin Resource Sharing (CORS) for browser-based applications. Allowed origins are configured via the `CORS_ORIGINS` environment variable.

---

🔒 = Requires authentication
📝 = Request body required
🔍 = Query parameters available



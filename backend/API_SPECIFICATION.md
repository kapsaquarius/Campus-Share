# CampusShare API Specification

## Overview

CampusShare is a student-focused platform for ride-sharing, roommate finding, and sublease management. This document provides comprehensive API documentation for the backend services.

**Base URL**: `http://localhost:5000/api`

**Authentication**: JWT Bearer Token (except for auth endpoints)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Locations](#locations)
3. [Rides](#rides)
4. [Subleases](#subleases)
5. [Roommates](#roommates)
6. [Reviews](#reviews)
7. [Notifications](#notifications)
8. [Error Handling](#error-handling)

---

## Authentication

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "phoneNumber": "",
    "whatsappNumber": "",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Login User
**POST** `/auth/login`

Authenticate user and get access token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "phoneNumber": "",
    "whatsappNumber": "",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Get User Profile
**GET** `/auth/profile`

Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "whatsappNumber": "+1234567890",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update User Profile
**PUT** `/auth/profile`

Update current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "phoneNumber": "+1234567890",
  "whatsappNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Smith",
    "phoneNumber": "+1234567890",
    "whatsappNumber": "+1234567890",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

---

## Locations

### Search Locations
**GET** `/locations/search?q=<query>&limit=<limit>`

Search for locations by city, state, or zip code.

**Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum results (default: 10)

**Response (200):**
```json
{
  "locations": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "zipCode": "80301",
      "city": "Boulder",
      "state": "CO",
      "stateName": "Colorado",
      "displayName": "Boulder, Colorado 80301"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "zipCode": "80302",
      "city": "Boulder",
      "state": "CO",
      "stateName": "Colorado",
      "displayName": "Boulder, Colorado 80302"
    }
  ],
  "total": 2,
  "query": "boulder"
}
```

### Get Location by ID
**GET** `/locations/<location_id>`

Get specific location details.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "zipCode": "80301",
  "city": "Boulder",
  "state": "CO",
  "stateName": "Colorado",
  "displayName": "Boulder, Colorado 80301"
}
```

---

## Rides

### Search Rides
**POST** `/rides/search`

Search for available rides with intelligent matching.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "travelDate": "2024-02-15",
  "startingFrom": "507f1f77bcf86cd799439011",
  "goingTo": "507f1f77bcf86cd799439012",
  "preferredTimeRange": {
    "start": "14:00",
    "end": "16:00"
  }
}
```

**Response (200):**
```json
{
  "rides": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "startingFrom": {
        "_id": "507f1f77bcf86cd799439011",
        "zipCode": "80301",
        "city": "Boulder",
        "state": "CO",
        "stateName": "Colorado",
        "displayName": "Boulder, Colorado 80301"
      },
      "goingTo": {
        "_id": "507f1f77bcf86cd799439012",
        "zipCode": "80202",
        "city": "Denver",
        "state": "CO",
        "stateName": "Colorado",
        "displayName": "Denver, Colorado 80202"
      },
      "travelDate": "2024-02-15",
      "departureStartTime": "14:30",
      "departureEndTime": "15:30",
      "availableSeats": 4,
      "seatsRemaining": 2,
      "suggestedContribution": {
        "amount": 25,
        "currency": "USD"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "driver": {
        "name": "John Doe",
        "phoneNumber": "+1234567890",
        "whatsappNumber": "+1234567890"
      },
      "interestCount": 3,
      "isHotRide": true
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

### Create Ride
**POST** `/rides/`

Create a new ride posting.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "startingFrom": "507f1f77bcf86cd799439011",
  "goingTo": "507f1f77bcf86cd799439012",
  "travelDate": "2024-02-15",
  "departureStartTime": "14:30",
  "departureEndTime": "15:30",
  "availableSeats": 4,
  "suggestedContribution": {
    "amount": 25,
    "currency": "USD"
  }
}
```

**Response (201):**
```json
{
  "message": "Ride posted successfully",
  "rideId": "507f1f77bcf86cd799439011"
}
```

### Express Interest in Ride
**POST** `/rides/<ride_id>/interest`

Express interest in a ride and get driver contact information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Interest expressed successfully",
  "rideProvider": {
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "whatsappNumber": "+1234567890"
  }
}
```

### Get My Rides
**GET** `/rides/my-rides`

Get current user's ride postings.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "rides": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "startingFrom": "507f1f77bcf86cd799439011",
      "goingTo": "507f1f77bcf86cd799439012",
      "travelDate": "2024-02-15",
      "departureStartTime": "14:30",
      "departureEndTime": "15:30",
      "availableSeats": 4,
      "seatsRemaining": 2,
      "suggestedContribution": {
        "amount": 25,
        "currency": "USD"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "interestCount": 3
    }
  ]
}
```

### Update Ride
**PUT** `/rides/<ride_id>`

Update ride posting details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "departureStartTime": "15:00",
  "departureEndTime": "16:00",
  "seatsRemaining": 1,
  "suggestedContribution": {
    "amount": 30,
    "currency": "USD"
  }
}
```

**Response (200):**
```json
{
  "message": "Ride updated successfully"
}
```

### Delete Ride
**DELETE** `/rides/<ride_id>`

Delete ride posting and notify interested users.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Ride deleted successfully"
}
```

---

## Subleases

### Search Subleases
**POST** `/subleases/search`

Search for available subleases with intelligent matching.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "startDate": "2024-05-01",
  "endDate": "2024-08-31",
  "maxRent": 1500,
  "location": "507f1f77bcf86cd799439011",
  "requiredAmenities": ["furnished", "wifi"],
  "minBedrooms": 1,
  "minBathrooms": 1,
  "preferredMoveInTime": "09:00",
  "preferredMoveOutTime": "17:00"
}
```

**Response (200):**
```json
{
  "subleases": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "location": {
        "_id": "507f1f77bcf86cd799439011",
        "zipCode": "80301",
        "city": "Boulder",
        "state": "CO",
        "stateName": "Colorado",
        "displayName": "Boulder, Colorado 80301"
      },
      "address": "123 Main St",
      "monthlyRent": 1200,
      "startDate": "2024-05-01",
      "endDate": "2024-08-31",
      "moveInTime": "09:00",
      "moveOutTime": "17:00",
      "bedrooms": 2,
      "bathrooms": 1,
      "propertyType": "apartment",
      "amenities": ["furnished", "wifi", "parking"],
      "description": "Cozy apartment near campus",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "proximityToCampus": "10-minute walk to campus",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "subleaser": {
        "name": "Jane Smith",
        "phoneNumber": "+1234567890",
        "whatsappNumber": "+1234567890"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

### Create Sublease
**POST** `/subleases/`

Create a new sublease posting.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "location": "507f1f77bcf86cd799439011",
  "address": "123 Main St",
  "monthlyRent": 1200,
  "startDate": "2024-05-01",
  "endDate": "2024-08-31",
  "moveInTime": "09:00",
  "moveOutTime": "17:00",
  "bedrooms": 2,
  "bathrooms": 1,
  "propertyType": "apartment",
  "amenities": ["furnished", "wifi", "parking"],
  "description": "Cozy apartment near campus",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "proximityToCampus": "10-minute walk to campus"
}
```

**Response (201):**
```json
{
  "message": "Sublease posted successfully",
  "subleaseId": "507f1f77bcf86cd799439011"
}
```

### Get My Subleases
**GET** `/subleases/my-subleases`

Get current user's sublease postings.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "subleases": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "location": "507f1f77bcf86cd799439011",
      "address": "123 Main St",
      "monthlyRent": 1200,
      "startDate": "2024-05-01",
      "endDate": "2024-08-31",
      "moveInTime": "09:00",
      "moveOutTime": "17:00",
      "bedrooms": 2,
      "bathrooms": 1,
      "propertyType": "apartment",
      "amenities": ["furnished", "wifi", "parking"],
      "description": "Cozy apartment near campus",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "proximityToCampus": "10-minute walk to campus",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Update Sublease
**PUT** `/subleases/<sublease_id>`

Update sublease posting details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "monthlyRent": 1300,
  "description": "Updated description",
  "amenities": ["furnished", "wifi", "parking", "ac"]
}
```

**Response (200):**
```json
{
  "message": "Sublease updated successfully"
}
```

### Delete Sublease
**DELETE** `/subleases/<sublease_id>`

Cancel sublease posting.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Sublease cancelled successfully"
}
```

---

## Roommates

### Search Roommates
**POST** `/roommates/search`

Search for compatible roommate matches.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "matches": [
    {
      "request": {
        "_id": "507f1f77bcf86cd799439011",
        "roomPreference": "single",
        "bathroomPreference": "own",
        "dietaryPreference": "vegetarian",
        "culturalPreference": "",
        "petFriendly": false,
        "rentBudget": {
          "min": 800,
          "max": 1200
        },
        "aboutMe": "Graduate student, early riser, likes quiet study",
        "lifestyleQuestionnaire": {
          "cleanlinessLevel": 4,
          "sleepSchedule": "early_bird",
          "guestFrequency": "rarely",
          "studyEnvironment": "quiet"
        },
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      },
      "user": {
        "name": "Jane Smith",
        "phoneNumber": "+1234567890",
        "whatsappNumber": "+1234567890"
      },
      "compatibilityScore": 0.85,
      "dealBreakers": []
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1,
  "incompatible_count": 5
}
```

### Create Roommate Request
**POST** `/roommates/`

Create a new roommate request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "roomPreference": "single",
  "bathroomPreference": "own",
  "dietaryPreference": "vegetarian",
  "culturalPreference": "",
  "petFriendly": false,
  "rentBudget": {
    "min": 800,
    "max": 1200
  },
  "aboutMe": "Graduate student, early riser, likes quiet study",
  "lifestyleQuestionnaire": {
    "cleanlinessLevel": 4,
    "sleepSchedule": "early_bird",
    "guestFrequency": "rarely",
    "studyEnvironment": "quiet"
  }
}
```

**Response (201):**
```json
{
  "message": "Roommate request created successfully",
  "requestId": "507f1f77bcf86cd799439011"
}
```

### Get My Roommate Request
**GET** `/roommates/my-request`

Get current user's roommate request.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "request": {
    "_id": "507f1f77bcf86cd799439011",
    "roomPreference": "single",
    "bathroomPreference": "own",
    "dietaryPreference": "vegetarian",
    "culturalPreference": "",
    "petFriendly": false,
    "rentBudget": {
      "min": 800,
      "max": 1200
    },
    "aboutMe": "Graduate student, early riser, likes quiet study",
    "lifestyleQuestionnaire": {
      "cleanlinessLevel": 4,
      "sleepSchedule": "early_bird",
      "guestFrequency": "rarely",
      "studyEnvironment": "quiet"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Roommate Request
**PUT** `/roommates/my-request`

Update current user's roommate request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rentBudget": {
    "min": 900,
    "max": 1300
  },
  "aboutMe": "Updated description"
}
```

**Response (200):**
```json
{
  "message": "Roommate request updated successfully"
}
```

### Delete Roommate Request
**DELETE** `/roommates/my-request`

Cancel current user's roommate request.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Roommate request cancelled successfully"
}
```

---

## Reviews

### Create Review
**POST** `/reviews/`

Create a review for a ride.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reviewedUserId": "507f1f77bcf86cd799439011",
  "rideId": "507f1f77bcf86cd799439012",
  "rating": 5,
  "review": "Great ride! Driver was punctual and friendly."
}
```

**Response (201):**
```json
{
  "message": "Review created successfully",
  "reviewId": "507f1f77bcf86cd799439013"
}
```

### Get User Reviews
**GET** `/reviews/user/<user_id>?page=<page>&per_page=<per_page>`

Get reviews for a specific user.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 10)

**Response (200):**
```json
{
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "reviewerId": "507f1f77bcf86cd799439012",
      "reviewedUserId": "507f1f77bcf86cd799439011",
      "rideId": "507f1f77bcf86cd799439013",
      "rating": 5,
      "review": "Great ride! Driver was punctual and friendly.",
      "createdAt": "2024-01-15T10:30:00Z",
      "reviewer": {
        "name": "John Doe",
        "profilePicture": ""
      }
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1,
  "averageRating": 5.0
}
```

### Get My Reviews
**GET** `/reviews/my-reviews?page=<page>&per_page=<per_page>`

Get current user's reviews.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "reviewedUserId": "507f1f77bcf86cd799439012",
      "rideId": "507f1f77bcf86cd799439013",
      "rating": 5,
      "review": "Great ride! Driver was punctual and friendly.",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

### Update Review
**PUT** `/reviews/<review_id>`

Update a review.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 4,
  "review": "Updated review text"
}
```

**Response (200):**
```json
{
  "message": "Review updated successfully"
}
```

### Delete Review
**DELETE** `/reviews/<review_id>`

Delete a review.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Review deleted successfully"
}
```

---

## Notifications

### Get Notifications
**GET** `/notifications/?page=<page>&per_page=<per_page>&unread_only=<unread_only>`

Get current user's notifications.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 20)
- `unread_only` (optional): Show only unread notifications (default: false)

**Response (200):**
```json
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "type": "ride_interest",
      "title": "New ride interest",
      "message": "John Doe is interested in your ride to Denver",
      "relatedId": "507f1f77bcf86cd799439013",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

### Get Unread Count
**GET** `/notifications/unread-count`

Get count of unread notifications.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "unreadCount": 5
}
```

### Mark Notification as Read
**PUT** `/notifications/<notification_id>/read`

Mark a notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
**PUT** `/notifications/mark-all-read`

Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Marked 5 notifications as read"
}
```

### Delete Notification
**DELETE** `/notifications/<notification_id>`

Delete a notification.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **404**: Not Found
- **500**: Internal Server Error

### Common Error Messages

- `"Unauthorized"`: Authentication required
- `"Missing required field: <field_name>"`: Required field not provided
- `"Invalid username or password"`: Login credentials incorrect
- `"Ride not found"`: Ride ID doesn't exist
- `"Already expressed interest"`: User already interested in this ride
- `"Cannot review yourself"`: User trying to review their own ride
- `"You have already reviewed this ride"`: Duplicate review attempt

---

## Authentication

### JWT Token Format
All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Expiration
JWT tokens expire after 24 hours. Users need to re-authenticate after expiration.

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## Data Types

### Date Format
All dates are in ISO 8601 format: `YYYY-MM-DD`

### Time Format
All times are in 24-hour format: `HH:MM`

### Object IDs
MongoDB Object IDs are returned as strings in responses.

### Currency
Monetary values include amount and currency:
```json
{
  "amount": 25,
  "currency": "USD"
}
```

---

## Testing

### Health Check
**GET** `/health`

Check if the API is running.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Development

### Running the API
```bash
cd backend
python run.py
```

The API will be available at `http://localhost:5000`

### Environment Variables
Create a `.env` file in the backend directory:
```
SECRET_KEY=your-secret-key
MONGODB_URI=mongodb://localhost:27017/campus_share
CORS_ORIGINS=http://localhost:3000
``` 
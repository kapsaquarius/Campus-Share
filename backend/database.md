# CampusShare Database Documentation

**Version:** 2.0  
**Last Updated:** August 2025  
**Application:** CampusShare Ride-Sharing Platform

## Overview

CampusShare is a focused ride-sharing platform for students. This document describes the MongoDB database schema, collections, and data structures used in the application.

## Database Information

- **Database Type:** MongoDB
- **Connection:** Configured via `MONGODB_URI` environment variable
- **Collections:** 5 active collections
- **Total Documents:** ~39,500+ documents (primarily location data)

## Collections Reference

### 1. Users Collection

**Purpose:** Stores user account information and authentication data.

**Collection Name:** `users`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  username: String,                 // Unique username for login
  email: String,                    // Unique email address  
  name: String,                     // User's full name
  password: String,                 // Hashed password (bcrypt)
  phone: String,                    // Contact phone number with country code
  whatsapp: String,                 // WhatsApp number with country code
  createdAt: Date,                  // Account creation timestamp
  updatedAt: Date                   // Last profile update timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d4bdb01faee5e370947fc",
  "username": "vmisra",
  "email": "vmisra@hotmail.com", 
  "name": "Vedant Misra",
  "phone": "+1 5822038438",
  "whatsapp": "+1 5822999938",
  "createdAt": "2025-08-01T23:20:59.255Z",
  "updatedAt": "2025-08-02T01:56:41.216Z"
}
```

**Indexes:**
- `username` (unique)
- `email` (unique)

---

### 2. Locations Collection

**Purpose:** Comprehensive US location data for ride origin and destination matching.

**Collection Name:** `locations`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  zipCode: String,                  // 5-digit ZIP code (e.g., "35004")
  city: String,                     // City name (e.g., "Moody")
  state: String,                    // 2-letter state code (e.g., "AL")
  stateName: String,                // Full state name (e.g., "Alabama")
  createdAt: Date,                  // Record creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d4b1b208869e7f3436c78",
  "zipCode": "35004",
  "city": "Moody", 
  "state": "AL",
  "stateName": "Alabama",
  "createdAt": "2025-08-01T23:17:47.969Z",
  "updatedAt": "2025-08-01T23:17:47.969Z"
}
```

**Indexes:**
- `zipCode` (unique)
- `city`
- `state`
- `[city, state]` (compound index for location searches)

**Note:** Contains 39,493+ location records covering comprehensive US geography.

---

### 3. Ride Posts Collection

**Purpose:** Main collection storing ride offerings created by users.

**Collection Name:** `ride_posts`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  userId: ObjectId,                 // Reference to Users collection
  startingFrom: String,             // Origin location (formatted address)
  goingTo: String,                  // Destination location (formatted address)
  travelDate: String,               // Travel date in YYYY-MM-DD format
  departureStartTime: String,       // Start time in HH:MM format (24-hour)
  departureEndTime: String,         // End time in HH:MM format (24-hour)
  availableSeats: Number,           // Total seats offered
  seatsRemaining: Number,           // Available seats remaining
  suggestedContribution: Number,    // Suggested payment per passenger
  status: String,                   // "active", "cancelled", "completed"
  additionalDetails: String,        // Optional details from driver
  createdAt: Date,                  // Ride creation timestamp
  updatedAt: Date                   // Last modification timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d6cbf6839853006a30d06",
  "userId": "688d4c0601faee5e370947ff",
  "startingFrom": "Salt Lake City, Utah",
  "goingTo": "State College, Pennsylvania", 
  "travelDate": "2025-08-26",
  "departureStartTime": "09:00",
  "departureEndTime": "10:00",
  "availableSeats": 2,
  "seatsRemaining": 2,
  "suggestedContribution": 500,
  "status": "active",
  "createdAt": "2025-08-02T01:41:19.523Z",
  "updatedAt": "2025-08-02T03:17:02.169Z",
  "additionalDetails": ""
}
```

**Indexes:**
- `userId` (for finding user's rides)
- `startingFrom` (for origin searches)
- `goingTo` (for destination searches)
- `travelDate` (for date-based searches)
- `status` (for filtering active rides)
- `createdAt` (for sorting by creation time)

**Status Values:**
- `active`: Ride is available for booking
- `cancelled`: Ride has been cancelled by driver
- `completed`: Ride has taken place

---

### 4. Ride Interests Collection

**Purpose:** Tracks user interest in specific rides (join requests).

**Collection Name:** `ride_interests`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  rideId: ObjectId,                 // Reference to ride_posts collection
  interestedUserId: ObjectId,       // Reference to Users collection (interested user)
  status: String,                   // "interested", "confirmed", "cancelled"
  createdAt: Date                   // Interest registration timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d6dc96839853006a30d29",
  "rideId": "688d6cbf6839853006a30d06",
  "interestedUserId": "688d4bdb01faee5e370947fc",
  "status": "interested",
  "createdAt": "2025-08-02T01:45:45.866Z"
}
```

**Indexes:**
- `rideId` (for finding interests for a specific ride)
- `interestedUserId` (for finding user's interests)
- `[rideId, interestedUserId]` (compound unique index to prevent duplicate interests)

**Status Values:**
- `interested`: User has expressed interest
- `confirmed`: Interest has been confirmed by driver
- `cancelled`: Interest has been withdrawn

---

### 5. Notifications Collection

**Purpose:** System notifications for ride-related events.

**Collection Name:** `notifications`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  userId: ObjectId,                 // Reference to Users collection (recipient)
  type: String,                     // Notification type
  title: String,                    // Notification title
  message: String,                  // Notification content
  relatedId: ObjectId,              // Reference to related entity (ride, etc.)
  read: Boolean,                    // Read status (default: false)
  createdAt: Date                   // Notification creation timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d4c4201faee5e37094817", 
  "userId": "688d4c0601faee5e370947ff",
  "type": "ride_interest",
  "title": "New Ride Interest",
  "message": "Vedant Misra is interested in your ride from State College, Pennsylvania to Boston, Massachusetts",
  "relatedId": "688d4c2c01faee5e37094805",
  "read": true,
  "createdAt": "2025-08-01T23:22:42.181Z"
}
```

**Indexes:**
- `userId` (for finding user's notifications)
- `read` (for filtering unread notifications)
- `createdAt` (for chronological ordering)

**Notification Types:**
- `ride_interest`: New user interested in a ride
- `ride_interest_removed`: User no longer interested in a ride
- `ride_update`: Ride details have been updated
- `ride_cancellation`: Ride has been cancelled

## Data Relationships

```
Users (1) ────→ (many) Ride Posts
Users (1) ────→ (many) Ride Interests  
Users (1) ────→ (many) Notifications

Ride Posts (1) ────→ (many) Ride Interests
Ride Posts (1) ────→ (many) Notifications

Locations ←─── Referenced by ─── Search/Display Logic
```

## Database Statistics

| Collection | Document Count | Average Size | Purpose |
|------------|----------------|--------------|---------|
| users | 8 | ~200 bytes | User accounts |
| locations | 39,493 | ~150 bytes | Location reference data |
| ride_posts | 1+ | ~400 bytes | Active ride offerings |
| ride_interests | 2+ | ~100 bytes | Join requests |
| notifications | 21+ | ~300 bytes | System notifications |

## Configuration

### Database Connection
```javascript
// Configured via environment variable
MONGODB_URI=mongodb://localhost:27017/campusshare
```

### Collection Creation
Collections are created automatically when first accessed. Indexes are created via the `create_indexes()` function in `scripts/database.py`.

## Maintenance Notes

- **Location Data**: Pre-loaded with comprehensive US ZIP code data
- **Cleanup**: Empty collections should be dropped periodically
- **Indexing**: Indexes are critical for search performance
- **Backups**: Regular backups recommended for user data

## Version History

- **v2.0 (August 2025)**: Streamlined to ride-sharing only, removed reviews/roommates/subleases
- **v1.0 (July 2025)**: Initial multi-feature platform

---

*This documentation reflects the current production database schema for CampusShare v2.0*
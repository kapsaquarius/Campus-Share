# CampusShare Database Documentation

**Application:** CampusShare - Student Ride Sharing & Roommate Matching Platform

## Overview

CampusShare is a comprehensive platform for students offering both ride-sharing and roommate matching services. This document describes the MongoDB database schema, collections, and data structures used in the application.

## Database Information

- **Database Type:** MongoDB
- **Connection:** Configured via `MONGODB_URI` environment variable
- **Collections:** 7 active collections
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
  email: String,                    // Email address (indexed, not unique)  
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
- `email` (non-unique, for lookups)
- `createdAt` (descending, for sorting)

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
  displayName: String,              // Formatted display name (e.g., "Moody, AL")
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
  "displayName": "Moody, AL",
  "createdAt": "2025-08-01T23:17:47.969Z",
  "updatedAt": "2025-08-01T23:17:47.969Z"
}
```

**Indexes:**
- `zipCode` (unique)
- `city`
- `state`
- `stateName`
- `displayName`
- `[city, state]` (compound index for location searches)
- `[state, city]` (compound index for reverse searches)
- Text search index on `[city, stateName, zipCode]`

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
- `userId`
- `startingFrom`
- `goingTo` 
- `travelDate`
- `status`
- `seatsRemaining`
- `createdAt` (descending)
- `[status, travelDate]`
- `[status, travelDate, seatsRemaining]`
- `[userId, status]`
- `[startingFrom, travelDate]`
- `[goingTo, travelDate]`

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
- `rideId`
- `interestedUserId`
- `status`
- `createdAt` (descending)
- `[rideId, interestedUserId]` (compound unique index to prevent duplicate interests)
- `[interestedUserId, status]`
- `[rideId, status]`

**Status Values:**
- `interested`: User has expressed interest
- `confirmed`: Interest has been confirmed by driver  
- `cancelled`: Interest has been withdrawn

---

### 5. Roommate Posts Collection

**Purpose:** Roommate listing posts for students seeking or offering housing.

**Collection Name:** `roommate_posts`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  userId: ObjectId,                 // Reference to Users collection
  type: String,                     // "offer" or "seek"
  location: String,                 // General location/area
  exactAddress: String,             // Specific address (optional)
  moveInEarliest: String,           // Earliest move-in date (YYYY-MM-DD)
  budgetMin: Number,                // Minimum budget (USD/month)
  budgetMax: Number,                // Maximum budget (USD/month)
  roomType: String,                 // Type of room/housing
  furnished: Boolean,               // Whether furnished
  petFriendly: Boolean,             // Pet-friendly
  smokerOk: Boolean,                // Smoking allowed
  dietaryPreference: String,        // Dietary preferences
  sleepSchedule: String,            // Sleep schedule preference
  guestsPerWeek: Number,            // Guest frequency preference
  additionalDetails: String,        // Additional notes
  status: String,                   // "active", "cancelled", "completed"
  createdAt: Date,                  // Post creation timestamp
  updatedAt: Date                   // Last modification timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d7abc6839853006a30d45",
  "userId": "688d4bdb01faee5e370947fc",
  "type": "seek",
  "location": "State College, PA",
  "exactAddress": null,
  "moveInEarliest": "2025-08-15",
  "budgetMin": 400,
  "budgetMax": 800,
  "roomType": "single",
  "furnished": true,
  "petFriendly": false,
  "smokerOk": false,
  "dietaryPreference": "vegetarian",
  "sleepSchedule": "early",
  "guestsPerWeek": 2,
  "additionalDetails": "Quiet, studious environment preferred",
  "status": "active",
  "createdAt": "2025-08-02T02:45:32.123Z",
  "updatedAt": "2025-08-02T02:45:32.123Z"
}
```

**Indexes:**
- `userId`
- `status`
- `type`
- `location`
- `moveInEarliest`
- `budgetMin`
- `budgetMax`
- `roomType`
- `furnished`
- `petFriendly`
- `smokerOk`
- `dietaryPreference`
- `sleepSchedule`
- `guestsPerWeek`
- `createdAt` (descending)
- `[status, type, location]`
- `[status, moveInEarliest]`

**Type Values:**
- `offer`: User has a room/place to offer
- `seek`: User is seeking a room/roommate

---

### 6. Roommate Interests Collection

**Purpose:** Tracks user interest in specific roommate listings.

**Collection Name:** `roommate_interests`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  postId: ObjectId,                 // Reference to roommate_posts collection
  interestedUserId: ObjectId,       // Reference to Users collection (interested user)
  status: String,                   // "interested", "confirmed", "cancelled"
  createdAt: Date                   // Interest registration timestamp
}
```

**Sample Document:**
```json
{
  "_id": "688d7bcd6839853006a30d52",
  "postId": "688d7abc6839853006a30d45",
  "interestedUserId": "688d4c0601faee5e370947ff",
  "status": "interested",
  "createdAt": "2025-08-02T02:50:21.456Z"
}
```

**Indexes:**
- `postId`
- `interestedUserId`
- `status`
- `createdAt` (descending)
- `[postId, interestedUserId]` (compound unique index to prevent duplicate interests)
- `[interestedUserId, status]`
- `[postId, status]`

**Status Values:**
- `interested`: User has expressed interest
- `confirmed`: Interest has been confirmed by poster
- `cancelled`: Interest has been withdrawn

---

### 7. Notifications Collection

**Purpose:** System notifications for ride and roommate related events.

**Collection Name:** `notifications`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Primary key
  userId: ObjectId,                 // Reference to Users collection (recipient)
  type: String,                     // Notification type
  title: String,                    // Notification title
  message: String,                  // Notification content
  relatedId: ObjectId,              // Reference to related entity (ride, roommate post, etc.)
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
- `userId`
- `read`
- `type`
- `relatedId`
- `createdAt` (descending)
- `[userId, read]`
- `[userId, createdAt]` (descending)
- `[userId, read, createdAt]` (descending)

**Notification Types:**

**Ride Notifications:**
- `ride_interest`: New user interested in a ride
- `ride_interest_removed`: User no longer interested in a ride
- `ride_update`: Ride details have been updated
- `ride_cancelled`: Ride has been cancelled

**Roommate Notifications:**
- `roommate_interest`: New user interested in a roommate listing
- `roommate_interest_removed`: User no longer interested in a roommate listing
- `roommate_update`: Roommate listing details have been updated
- `roommate_cancelled`: Roommate listing has been cancelled

## Data Relationships

```
Users (1) ────→ (many) Ride Posts
Users (1) ────→ (many) Ride Interests  
Users (1) ────→ (many) Roommate Posts
Users (1) ────→ (many) Roommate Interests
Users (1) ────→ (many) Notifications

Ride Posts (1) ────→ (many) Ride Interests
Ride Posts (1) ────→ (many) Notifications

Roommate Posts (1) ────→ (many) Roommate Interests
Roommate Posts (1) ────→ (many) Notifications

Locations ←─── Referenced by ─── Search/Display Logic
```

## Configuration

### Database Connection
```javascript
// Configured via environment variable
MONGODB_URI=mongodb://localhost:27017/campus-share
// or
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/campus-share
```

### Collection Creation
Collections are created automatically when first accessed. Indexes are created via the database setup functions in `scripts/setup_cloud_database.py`.

### Setup Script
Run the database setup script to create all collections and indexes:
```bash
python scripts/setup_cloud_database.py
```





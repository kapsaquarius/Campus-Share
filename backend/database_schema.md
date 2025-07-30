# CampusShare Database Schema

This document outlines the MongoDB collections and their schemas for the CampusShare application.

## Collections Overview

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  username: String,           // Unique username for login
  email: String,              // Unique email address
  name: String,               // Full name
  password: String,           // Hashed password
  phone: String,              // Contact phone number
  whatsapp: String,           // WhatsApp number
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Locations Collection
```javascript
{
  _id: ObjectId,
  zipCode: String,            // "35004"
  city: String,               // "Moody"
  state: String,              // "AL" (State Code)
  stateName: String,          // "Alabama" (State Name)
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Ride Posts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to Users
  startingFrom: ObjectId,     // Reference to Locations
  goingTo: ObjectId,          // Reference to Locations
  travelDate: Date,
  departureStartTime: String, // "14:30" (HH:MM format)
  departureEndTime: String,   // "15:30" (HH:MM format)
  availableSeats: Number,
  seatsRemaining: Number,
  suggestedContribution: {
    min: Number,
    max: Number
  },
  status: String,             // "active", "cancelled", "completed"
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Ride Interests Collection
```javascript
{
  _id: ObjectId,
  rideId: ObjectId,           // Reference to Ride Posts
  userId: ObjectId,           // Reference to Users
  status: String,             // "interested", "confirmed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Roommate Requests Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to Users
  roomPreference: String,     // "single", "shared", "flexible"
  bathroomPreference: String, // "private", "shared", "flexible"
  dietaryPreference: String,  // "pure_vegetarian", "vegetarian", "eggetarian", "non_vegetarian"
  culturalPreference: String, // Optional: religion/caste preference
  petFriendly: Boolean,       // true/false
  rentBudget: {
    min: Number,
    max: Number
  },
  lifestyleQuestionnaire: {
    cleanlinessLevel: Number,  // 1-5 scale
    sleepSchedule: String,     // "early_bird", "night_owl", "flexible"
    guestFrequency: String,    // "rarely", "sometimes", "often"
    studyEnvironment: String,  // "quiet", "moderate", "noisy"
    smoking: String,          // "no", "occasionally", "regularly"
    alcohol: String           // "no", "occasionally", "regularly"
  },
  aboutMe: String,            // Personal description
  status: String,             // "active", "found", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Sublease Posts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to Users
  location: ObjectId,         // Reference to Locations
  moveInTime: String,         // "2024-05-15" (YYYY-MM-DD format)
  moveOutTime: String,        // "2024-08-10" (YYYY-MM-DD format)
  monthlyRent: Number,
  bedrooms: Number,
  bathrooms: Number,
  propertyType: String,       // "apartment", "house", "shared_room"
  amenities: [String],        // ["furnished", "wifi", "parking", "laundry"]
  description: String,
  proximityToCampus: String,  // "10-minute walk", "on bus route"
  photos: [String],           // Array of photo URLs
  status: String,             // "active", "rented", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Reviews Collection
```javascript
{
  _id: ObjectId,
  reviewerId: ObjectId,       // Reference to Users (who wrote the review)
  reviewedId: ObjectId,       // Reference to Users (who is being reviewed)
  rideId: ObjectId,           // Optional: Reference to Ride Posts
  rating: Number,             // 1-5 stars
  review: String,             // Written review
  createdAt: Date,
  updatedAt: Date
}
```

### 8. Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to Users (recipient)
  type: String,               // "ride_interest", "ride_update", "ride_cancellation"
  title: String,              // Notification title
  message: String,            // Notification message
  relatedId: ObjectId,        // Reference to related entity (ride, sublease, etc.)
  read: Boolean,              // false by default
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### Users Collection
- `username` (unique)
- `email` (unique)

### Locations Collection
- `zipCode` (unique)
- `city`
- `state`
- `[city, state]` (compound)

### Ride Posts Collection
- `userId`
- `startingFrom`
- `goingTo`
- `travelDate`
- `status`

### Ride Interests Collection
- `rideId`
- `userId`
- `[rideId, userId]` (compound, unique)

### Roommate Requests Collection
- `userId`
- `status`
- `dietaryPreference`
- `rentBudget.min`
- `rentBudget.max`

### Sublease Posts Collection
- `userId`
- `location`
- `moveInTime`
- `moveOutTime`
- `monthlyRent`
- `status`

### Reviews Collection
- `reviewerId`
- `reviewedId`
- `rideId`

### Notifications Collection
- `userId`
- `read`
- `createdAt` 
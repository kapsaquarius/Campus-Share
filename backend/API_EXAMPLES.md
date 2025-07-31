# CampusShare API Examples

This document provides practical examples of how to use the CampusShare API with curl commands and real-world scenarios.

**Base URL**: `http://localhost:5000/api`

---

## Quick Start

### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

**Expected Response:**
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

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepassword123"
  }'
```

### 3. Search for Locations
```bash
curl -X GET "http://localhost:5000/api/locations/search?q=boulder&limit=5"
```

---

## Complete User Journey Examples

### Scenario 1: Ride Sharing

#### Step 1: User Registration
```bash
# Register as a driver
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "driver_jane",
    "email": "jane@example.com",
    "password": "password123",
    "name": "Jane Smith"
  }'
```

#### Step 2: Update Profile with Contact Info
```bash
# Get the token from registration response
TOKEN="your_jwt_token_here"

curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "whatsappNumber": "+1234567890"
  }'
```

#### Step 3: Search for Locations
```bash
# Search for Boulder locations
curl -X GET "http://localhost:5000/api/locations/search?q=boulder&limit=3"
```

#### Step 4: Create a Ride Posting
```bash
# Use location IDs from the search response
curl -X POST http://localhost:5000/api/rides/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
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
  }'
```

#### Step 5: Search for Rides (as a passenger)
```bash
# Register as a passenger
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "passenger_bob",
    "email": "bob@example.com",
    "password": "password123",
    "name": "Bob Johnson"
  }'

# Get passenger token
PASSENGER_TOKEN="passenger_jwt_token_here"

# Search for rides
curl -X POST http://localhost:5000/api/rides/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -d '{
    "travelDate": "2024-02-15",
    "startingFrom": "507f1f77bcf86cd799439011",
    "goingTo": "507f1f77bcf86cd799439012",
    "preferredTimeRange": {
      "start": "14:00",
      "end": "16:00"
    }
  }'
```

#### Step 6: Express Interest in a Ride
```bash
# Use ride ID from search response
RIDE_ID="ride_id_from_search"

curl -X POST http://localhost:5000/api/rides/$RIDE_ID/interest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSENGER_TOKEN"
```

#### Step 7: Review the Ride (after trip)
```bash
# Create a review
curl -X POST http://localhost:5000/api/reviews/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -d '{
    "reviewedUserId": "507f1f77bcf86cd799439011",
    "rideId": "507f1f77bcf86cd799439012",
    "rating": 5,
    "review": "Great ride! Jane was punctual and friendly."
  }'
```

### Scenario 2: Sublease Management

#### Step 1: Create a Sublease Posting
```bash
# Use the driver token from previous scenario
curl -X POST http://localhost:5000/api/subleases/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": "507f1f77bcf86cd799439011",
    "address": "123 Main St, Boulder, CO",
    "monthlyRent": 1200,
    "startDate": "2024-05-01",
    "endDate": "2024-08-31",
    "moveInTime": "09:00",
    "moveOutTime": "17:00",
    "bedrooms": 2,
    "bathrooms": 1,
    "propertyType": "apartment",
    "amenities": ["furnished", "wifi", "parking"],
    "description": "Cozy apartment near campus with mountain views",
    "photos": ["photo1.jpg", "photo2.jpg"],
    "proximityToCampus": "10-minute walk to campus"
  }'
```

#### Step 2: Search for Subleases
```bash
# Search as a different user
curl -X POST http://localhost:5000/api/subleases/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -d '{
    "startDate": "2024-05-01",
    "endDate": "2024-08-31",
    "maxRent": 1500,
    "location": "507f1f77bcf86cd799439011",
    "requiredAmenities": ["furnished", "wifi"],
    "minBedrooms": 1,
    "minBathrooms": 1,
    "preferredMoveInTime": "09:00",
    "preferredMoveOutTime": "17:00"
  }'
```

### Scenario 3: Roommate Finding

#### Step 1: Create a Roommate Request
```bash
curl -X POST http://localhost:5000/api/roommates/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "roomPreference": "single",
    "bathroomPreference": "own",
    "dietaryPreference": "vegetarian",
    "culturalPreference": "",
    "petFriendly": false,
    "rentBudget": {
      "min": 800,
      "max": 1200
    },
    "aboutMe": "Graduate student in Computer Science, early riser, likes quiet study environment",
    "lifestyleQuestionnaire": {
      "cleanlinessLevel": 4,
      "sleepSchedule": "early_bird",
      "guestFrequency": "rarely",
      "studyEnvironment": "quiet"
    }
  }'
```

#### Step 2: Search for Roommate Matches
```bash
curl -X POST http://localhost:5000/api/roommates/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Advanced Examples

### Batch Operations

#### Get All User's Data
```bash
# Get user's rides, subleases, and roommate request
curl -X GET http://localhost:5000/api/rides/my-rides \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:5000/api/subleases/my-subleases \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:5000/api/roommates/my-request \
  -H "Authorization: Bearer $TOKEN"
```

#### Get All Notifications
```bash
# Get all notifications
curl -X GET "http://localhost:5000/api/notifications/?page=1&per_page=50" \
  -H "Authorization: Bearer $TOKEN"

# Get only unread notifications
curl -X GET "http://localhost:5000/api/notifications/?unread_only=true" \
  -H "Authorization: Bearer $TOKEN"

# Get unread count
curl -X GET http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

### Error Handling Examples

#### Invalid Token
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer invalid_token"
```
**Response:**
```json
{
  "error": "Unauthorized"
}
```

#### Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user"
  }'
```
**Response:**
```json
{
  "error": "Registration failed"
}
```

#### Duplicate Interest
```bash
# Try to express interest twice
curl -X POST http://localhost:5000/api/rides/$RIDE_ID/interest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PASSENGER_TOKEN"
```
**Response:**
```json
{
  "error": "Already expressed interest"
}
```

---

## Testing Scripts

### Complete Test Flow
```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api"

echo -e "${YELLOW}Starting CampusShare API Test Flow${NC}"

# 1. Register user
echo -e "${YELLOW}1. Registering user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')

echo $REGISTER_RESPONSE

# Extract token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ User registered successfully${NC}"

# 2. Search locations
echo -e "${YELLOW}2. Searching locations...${NC}"
LOCATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/locations/search?q=boulder&limit=3")
echo $LOCATIONS_RESPONSE

# 3. Create a ride
echo -e "${YELLOW}3. Creating a ride...${NC}"
RIDE_RESPONSE=$(curl -s -X POST $BASE_URL/rides/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
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
  }')

echo $RIDE_RESPONSE
echo -e "${GREEN}✓ Test flow completed${NC}"
```

### Health Check
```bash
curl -X GET http://localhost:5000/health
```

---

## Common Patterns

### Setting Environment Variables
```bash
# Set your token as environment variable
export TOKEN="your_jwt_token_here"

# Use in curl commands
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Pretty Print JSON Responses
```bash
# Use jq to format JSON responses
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Save Responses to Files
```bash
# Save API response to file
curl -X GET http://localhost:5000/api/rides/my-rides \
  -H "Authorization: Bearer $TOKEN" > my_rides.json
```

---

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if server is running
   curl -X GET http://localhost:5000/health
   ```

2. **Invalid Token**
   ```bash
   # Re-login to get fresh token
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "your_username",
       "password": "your_password"
     }'
   ```

3. **CORS Issues**
   - Ensure CORS is properly configured in the backend
   - Check if the frontend origin is allowed

4. **Database Connection**
   - Verify MongoDB is running
   - Check connection string in `.env` file

### Debug Mode
```bash
# Run with verbose output
curl -v -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test registration endpoint
ab -n 100 -c 10 -p register_data.json -T application/json \
   http://localhost:5000/api/auth/register

# Test search endpoint
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
   http://localhost:5000/api/rides/search
```

### Monitor Response Times
```bash
# Time the API calls
time curl -X GET http://localhost:5000/api/rides/my-rides \
  -H "Authorization: Bearer $TOKEN"
```

---

This document provides practical examples for testing and integrating with the CampusShare API. Use these examples as a starting point for your frontend development and testing. 
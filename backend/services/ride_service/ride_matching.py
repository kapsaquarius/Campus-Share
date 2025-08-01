from datetime import datetime
from scripts.database import get_collection
from services.location_service import location_service
import re

def calculate_time_overlap(driver_start_time, driver_end_time, rider_start_time, rider_end_time):
    """Calculate overlap between driver's time range and rider's preferred time"""
    # Convert time strings to minutes for easier comparison
    def time_to_minutes(time_str):
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    
    driver_start_min = time_to_minutes(driver_start_time)
    driver_end_min = time_to_minutes(driver_end_time)
    rider_start_min = time_to_minutes(rider_start_time)
    rider_end_min = time_to_minutes(rider_end_time)
    
    # Calculate overlap
    overlap_start = max(driver_start_min, rider_start_min)
    overlap_end = min(driver_end_min, rider_end_min)
    
    if overlap_start >= overlap_end:
        return 0.0
    
    overlap_duration = overlap_end - overlap_start
    total_duration = min(driver_end_min - driver_start_min, rider_end_min - rider_start_min)
    
    return overlap_duration / total_duration if total_duration > 0 else 0.0

def validate_time_format(time_str):
    """Validate time format (HH:MM in 24-hour format)"""
    import re
    pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
    if not re.match(pattern, time_str):
        return False
    return True

def is_valid_time_range(start_time, end_time):
    """Check if start time is before end time"""
    def time_to_minutes(time_str):
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    
    start_min = time_to_minutes(start_time)
    end_min = time_to_minutes(end_time)
    
    return start_min < end_min

def calculate_location_match_score(ride, search_criteria):
    """Calculate location matching score with intelligent city-level matching"""
    starting_score = 0.0
    destination_score = 0.0
    
    # Check starting location match
    if search_criteria.get('startingFrom'):
        search_starting_variations = get_location_variations(search_criteria['startingFrom'])
        ride_starting_variations = get_location_variations(ride.get('startingFrom', ''))
        
        # Check if there's any overlap between variations
        if any(var in ride_starting_variations for var in search_starting_variations):
            # Give higher score for exact matches, lower for city-level matches
            if ride['startingFrom'] == search_criteria['startingFrom']:
                starting_score = 1.0  # Exact match
            else:
                starting_score = 0.9  # City-level match
    
    # Check destination match
    if search_criteria.get('goingTo'):
        search_destination_variations = get_location_variations(search_criteria['goingTo'])
        ride_destination_variations = get_location_variations(ride.get('goingTo', ''))
        
        # Check if there's any overlap between variations
        if any(var in ride_destination_variations for var in search_destination_variations):
            # Give higher score for exact matches, lower for city-level matches
            if ride['goingTo'] == search_criteria['goingTo']:
                destination_score = 1.0  # Exact match
            else:
                destination_score = 0.9  # City-level match
    
    # Both locations must match for a valid ride
    if starting_score > 0 and destination_score > 0:
        return (starting_score + destination_score) / 2
    else:
        return 0.0

def calculate_ride_score(ride, search_criteria):
    """Calculate a comprehensive score for ride matching"""
    score = 0.0
    
    # Location matching (50% weight) - intelligent city-level matching
    location_score = calculate_location_match_score(ride, search_criteria)
    score += location_score * 0.5
    
    # Time overlap (30% weight) - only if time preferences are provided
    if search_criteria.get('preferredStartTime') and search_criteria.get('preferredEndTime'):
        time_overlap = calculate_time_overlap(
            ride['departureStartTime'],
            ride['departureEndTime'],
            search_criteria['preferredStartTime'],
            search_criteria['preferredEndTime']
        )
        score += time_overlap * 0.3
    else:
        # If no time preference, give full points for time
        score += 0.3
    
    # Seat availability (10% weight)
    seat_score = min(ride['seatsRemaining'] / ride['availableSeats'], 1.0)
    score += seat_score * 0.1
    
    # Popularity bonus (5% weight)
    ride_interests = get_collection('ride_interests')
    interest_count = ride_interests.count_documents({'rideId': ride['_id']})
    popularity_score = min(interest_count / 5.0, 1.0)  # Cap at 5 interests
    score += popularity_score * 0.05
    
    # Recency bonus (5% weight)
    try:
        # Handle both string and date formats
        if isinstance(ride['travelDate'], str):
            ride_date = datetime.strptime(ride['travelDate'], '%Y-%m-%d').date()
        else:
            ride_date = ride['travelDate']
        
        days_until_travel = (ride_date - datetime.now().date()).days
        recency_score = max(0, 1 - (days_until_travel / 30))  # Favor rides within 30 days
        score += recency_score * 0.05
    except (ValueError, TypeError):
        # If date parsing fails, give neutral score
        score += 0.025
    
    return score

def has_time_overlap(driver_start_time, driver_end_time, rider_start_time, rider_end_time):
    """Check if two time ranges have any overlap"""
    # Convert time strings to minutes for easier comparison
    def time_to_minutes(time_str):
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    
    driver_start_min = time_to_minutes(driver_start_time)
    driver_end_min = time_to_minutes(driver_end_time)
    rider_start_min = time_to_minutes(rider_start_time)
    rider_end_min = time_to_minutes(rider_end_time)
    
    # Two ranges overlap if: start1 <= end2 AND start2 <= end1
    return driver_start_min <= rider_end_min and rider_start_min <= driver_end_min

def search_rides_with_scoring(search_criteria, user_id=None):
    """Search for rides and apply intelligent scoring with city-level matching"""
    ride_posts = get_collection('ride_posts')
    
    # Convert date to string for MongoDB query
    travel_date_str = search_criteria['travelDate'].strftime('%Y-%m-%d') if hasattr(search_criteria['travelDate'], 'strftime') else str(search_criteria['travelDate'])
    
    # Base query
    base_query = {
        'status': 'active',
        'travelDate': travel_date_str,
        'seatsRemaining': {'$gt': 0}
    }
    
    # Exclude user's own rides if user is authenticated
    if user_id:
        from bson import ObjectId
        base_query['userId'] = {'$ne': ObjectId(user_id)}
    
    # Build intelligent location filters
    location_filters = {}
    
    if search_criteria.get('startingFrom'):
        starting_variations = get_location_variations(search_criteria['startingFrom'])
        if starting_variations:
            location_filters['startingFrom'] = {'$in': starting_variations}
    
    if search_criteria.get('goingTo'):
        destination_variations = get_location_variations(search_criteria['goingTo'])
        if destination_variations:
            location_filters['goingTo'] = {'$in': destination_variations}
    
    # Combine base query with location filters
    if location_filters:
        base_query.update(location_filters)
    
    potential_rides = list(ride_posts.find(base_query))
    
    # If user is authenticated, exclude rides they've already expressed interest in AND their own rides
    if user_id and potential_rides:
        from bson import ObjectId
        ride_interests = get_collection('ride_interests')
        
        # Get ride IDs user has expressed interest in
        user_interested_rides = ride_interests.find({
            'interestedUserId': ObjectId(user_id),
            'status': 'interested'
        }, {'rideId': 1})
        
        interested_ride_ids = {str(interest['rideId']) for interest in user_interested_rides}
        
        # Filter out rides user has already expressed interest in AND user's own rides
        potential_rides = [
            ride for ride in potential_rides 
            if str(ride['_id']) not in interested_ride_ids and str(ride['userId']) != str(user_id)
        ]
    
    scored_rides = []
    
    # Check if user provided time preferences
    has_time_preferences = (search_criteria.get('preferredStartTime') and 
                           search_criteria.get('preferredEndTime'))
    
    for ride in potential_rides:
        # If user specified time preferences, filter out rides with zero overlap
        if has_time_preferences:
            if not has_time_overlap(
                ride['departureStartTime'],
                ride['departureEndTime'],
                search_criteria['preferredStartTime'],
                search_criteria['preferredEndTime']
            ):
                continue  # Skip rides with no time overlap
        
        score = calculate_ride_score(ride, search_criteria)
        if score > 0.1:  # Only include rides with meaningful scores
            ride['matchScore'] = score
            scored_rides.append(ride)
    
    # Sort by match score (highest first)
    scored_rides.sort(key=lambda x: x['matchScore'], reverse=True)
    
    return scored_rides

def get_location_variations(location_string):
    """Get all possible variations of a location for intelligent matching"""
    if not location_string:
        return []
    
    # Parse the location string
    parsed = location_service.parse_location_string(location_string)
    if not parsed:
        # If parsing fails, return the original string for exact match
        return [location_string]
    
    variations = [location_string]  # Always include the original
    
    # Get all display name variations for this city
    try:
        if parsed['city'] and parsed['state']:
            city_variations = location_service.get_all_city_display_names(
                parsed['city'], 
                parsed['state']
            )
            variations.extend(city_variations)
    except Exception as e:
        print(f"Error getting location variations: {e}")
    
    # Remove duplicates while preserving order
    seen = set()
    unique_variations = []
    for variation in variations:
        if variation not in seen:
            seen.add(variation)
            unique_variations.append(variation)
    
    return unique_variations

def get_ride_with_details(ride_id):
    """Get a ride with driver information and interest count using aggregation"""
    ride_posts = get_collection('ride_posts')
    
    # Use aggregation to get ride, driver, and interest count
    pipeline = [
        {'$match': {'_id': ride_id}},
        {'$lookup': {
            'from': 'users',
            'localField': 'userId',
            'foreignField': '_id',
            'as': 'driver'
        }},
        {'$lookup': {
            'from': 'ride_interests',
            'localField': '_id',
            'foreignField': 'rideId',
            'as': 'interests'
        }},
        {'$unwind': {'path': '$driver', 'preserveNullAndEmptyArrays': True}},
        {'$addFields': {
            'interestCount': {'$size': '$interests'},
            'isHotRide': {'$gte': [{'$size': '$interests'}, 3]}
        }}
    ]
    
    ride_details = list(ride_posts.aggregate(pipeline))
    
    if not ride_details:
        return None
    
    ride_data = ride_details[0]
    
    # Helper function to format location data
    def format_location_field(location_value):
        if not location_value:
            return None
        
        # If it's already an object (from locations collection), use it
        if isinstance(location_value, dict) and 'displayName' in location_value:
            return location_value
        
        # If it's a string, create a location object
        if isinstance(location_value, str):
            return {
                'displayName': location_value
            }
        
        return None
    
    # Format the response
    formatted_ride = {
        '_id': str(ride_data['_id']),
        'userId': str(ride_data['userId']),  # Include userId for filtering
        'startingFrom': format_location_field(ride_data.get('startingFrom')),
        'goingTo': format_location_field(ride_data.get('goingTo')),
        'travelDate': ride_data['travelDate'],
        'departureStartTime': ride_data['departureStartTime'],
        'departureEndTime': ride_data['departureEndTime'],
        'availableSeats': ride_data['availableSeats'],
        'seatsRemaining': ride_data['seatsRemaining'],
        'suggestedContribution': {
            'amount': ride_data.get('suggestedContribution', 0),
            'currency': 'USD'
        },
        'status': ride_data['status'],
        'createdAt': ride_data['createdAt'],
        'updatedAt': ride_data['updatedAt'],
        'driver': {
            'name': ride_data['driver']['name'],
            'phoneNumber': ride_data['driver'].get('phone', ''),
            'whatsappNumber': ride_data['driver'].get('whatsapp', '')
        } if ride_data.get('driver') else None,
        'interestCount': ride_data['interestCount'],
        'isHotRide': ride_data['isHotRide']
    }
    
    return formatted_ride 
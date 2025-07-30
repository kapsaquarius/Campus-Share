from datetime import datetime
from scripts.database import get_collection
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

def calculate_ride_score(ride, search_criteria):
    """Calculate a comprehensive score for ride matching"""
    score = 0.0
    
    # Location matching (50% weight) - now exact match since users select from dropdown
    if ride['startingFrom'] == search_criteria['startingFrom'] and ride['goingTo'] == search_criteria['goingTo']:
        location_score = 1.0
    else:
        location_score = 0.0
    score += location_score * 0.5
    
    # Time overlap (30% weight)
    time_overlap = calculate_time_overlap(
        ride['departureStartTime'],
        ride['departureEndTime'],
        search_criteria['preferredStartTime'],
        search_criteria['preferredEndTime']
    )
    score += time_overlap * 0.3
    
    # Seat availability (10% weight)
    seat_score = min(ride['seatsRemaining'] / ride['availableSeats'], 1.0)
    score += seat_score * 0.1
    
    # Popularity bonus (5% weight)
    ride_interests = get_collection('ride_interests')
    interest_count = ride_interests.count_documents({'rideId': ride['_id']})
    popularity_score = min(interest_count / 5.0, 1.0)  # Cap at 5 interests
    score += popularity_score * 0.05
    
    # Recency bonus (5% weight)
    days_until_travel = (ride['travelDate'] - datetime.now().date()).days
    recency_score = max(0, 1 - (days_until_travel / 30))  # Favor rides within 30 days
    score += recency_score * 0.05
    
    return score

def search_rides_with_scoring(search_criteria):
    """Search for rides and apply intelligent scoring"""
    ride_posts = get_collection('ride_posts')
    
    # Base query - exact location matches since users select from dropdown
    base_query = {
        'status': 'active',
        'travelDate': search_criteria['travelDate'],
        'startingFrom': search_criteria['startingFrom'],
        'goingTo': search_criteria['goingTo'],
        'seatsRemaining': {'$gt': 0}
    }
    
    potential_rides = list(ride_posts.find(base_query))
    scored_rides = []
    
    for ride in potential_rides:
        score = calculate_ride_score(ride, search_criteria)
        if score > 0.1:  # Only include rides with meaningful scores
            ride['matchScore'] = score
            scored_rides.append(ride)
    
    # Sort by match score (highest first)
    scored_rides.sort(key=lambda x: x['matchScore'], reverse=True)
    
    return scored_rides

def get_ride_with_details(ride_id):
    """Get a ride with driver information and interest count"""
    ride_posts = get_collection('ride_posts')
    ride_interests = get_collection('ride_interests')
    users = get_collection('users')
    locations = get_collection('locations')
    
    ride = ride_posts.find_one({'_id': ride_id})
    if not ride:
        return None
    
    # Get driver information
    driver = users.find_one({'_id': ride['userId']})
    
    # Get location details
    starting_from = locations.find_one({'_id': ride['startingFrom']})
    going_to = locations.find_one({'_id': ride['goingTo']})
    
    # Get interest count
    interest_count = ride_interests.count_documents({'rideId': ride_id})
    
    # Format the response
    ride_details = {
        '_id': str(ride['_id']),
        'startingFrom': {
            '_id': str(starting_from['_id']),
            'zipCode': starting_from['zipCode'],
            'city': starting_from['city'],
            'state': starting_from['state'],
            'stateName': starting_from['stateName'],
            'displayName': f"{starting_from['city']}, {starting_from['stateName']} {starting_from['zipCode']}"
        } if starting_from else None,
        'goingTo': {
            '_id': str(going_to['_id']),
            'zipCode': going_to['zipCode'],
            'city': going_to['city'],
            'state': going_to['state'],
            'stateName': going_to['stateName'],
            'displayName': f"{going_to['city']}, {going_to['stateName']} {going_to['zipCode']}"
        } if going_to else None,
        'travelDate': ride['travelDate'],
        'departureStartTime': ride['departureStartTime'],
        'departureEndTime': ride['departureEndTime'],
        'availableSeats': ride['availableSeats'],
        'seatsRemaining': ride['seatsRemaining'],
        'suggestedContribution': ride['suggestedContribution'],
        'status': ride['status'],
        'createdAt': ride['createdAt'],
        'updatedAt': ride['updatedAt'],
        'driver': {
            'name': driver['name'],
            'phoneNumber': driver.get('phoneNumber', ''),
            'whatsappNumber': driver.get('whatsappNumber', '')
        } if driver else None,
        'interestCount': interest_count,
        'isHotRide': interest_count >= 3
    }
    
    return ride_details 
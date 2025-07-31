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
    days_until_travel = (ride['travelDate'] - datetime.now().date()).days
    recency_score = max(0, 1 - (days_until_travel / 30))  # Favor rides within 30 days
    score += recency_score * 0.05
    
    return score

def search_rides_with_scoring(search_criteria):
    """Search for rides and apply intelligent scoring"""
    ride_posts = get_collection('ride_posts')
    
    # Convert date to string for MongoDB query
    travel_date_str = search_criteria['travelDate'].strftime('%Y-%m-%d') if hasattr(search_criteria['travelDate'], 'strftime') else str(search_criteria['travelDate'])
    
    # Base query - exact location matches since users select from dropdown
    base_query = {
        'status': 'active',
        'travelDate': travel_date_str,
        'seatsRemaining': {'$gt': 0}
    }
    
    # Add location filters if provided
    if search_criteria.get('startingFrom'):
        base_query['startingFrom'] = search_criteria['startingFrom']
    if search_criteria.get('goingTo'):
        base_query['goingTo'] = search_criteria['goingTo']
    
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
    """Get a ride with driver information and interest count using aggregation"""
    ride_posts = get_collection('ride_posts')
    
    # Use aggregation to get ride, driver, locations, and interest count in one query
    pipeline = [
        {'$match': {'_id': ride_id}},
        {'$lookup': {
            'from': 'users',
            'localField': 'userId',
            'foreignField': '_id',
            'as': 'driver'
        }},
        {'$lookup': {
            'from': 'locations',
            'localField': 'startingFrom',
            'foreignField': '_id',
            'as': 'startingLocation'
        }},
        {'$lookup': {
            'from': 'locations',
            'localField': 'goingTo',
            'foreignField': '_id',
            'as': 'goingLocation'
        }},
        {'$lookup': {
            'from': 'ride_interests',
            'localField': '_id',
            'foreignField': 'rideId',
            'as': 'interests'
        }},
        {'$unwind': {'path': '$driver', 'preserveNullAndEmptyArrays': True}},
        {'$unwind': {'path': '$startingLocation', 'preserveNullAndEmptyArrays': True}},
        {'$unwind': {'path': '$goingLocation', 'preserveNullAndEmptyArrays': True}},
        {'$addFields': {
            'interestCount': {'$size': '$interests'},
            'isHotRide': {'$gte': [{'$size': '$interests'}, 3]}
        }}
    ]
    
    ride_details = list(ride_posts.aggregate(pipeline))
    
    if not ride_details:
        return None
    
    ride_data = ride_details[0]
    
    # Format the response
    formatted_ride = {
        '_id': str(ride_data['_id']),
        'startingFrom': {
            '_id': str(ride_data['startingLocation']['_id']),
            'zipCode': ride_data['startingLocation']['zipCode'],
            'city': ride_data['startingLocation']['city'],
            'state': ride_data['startingLocation']['state'],
            'stateName': ride_data['startingLocation']['stateName'],
            'displayName': f"{ride_data['startingLocation']['city']}, {ride_data['startingLocation']['stateName']} {ride_data['startingLocation']['zipCode']}"
        } if ride_data.get('startingLocation') else None,
        'goingTo': {
            '_id': str(ride_data['goingLocation']['_id']),
            'zipCode': ride_data['goingLocation']['zipCode'],
            'city': ride_data['goingLocation']['city'],
            'state': ride_data['goingLocation']['state'],
            'stateName': ride_data['goingLocation']['stateName'],
            'displayName': f"{ride_data['goingLocation']['city']}, {ride_data['goingLocation']['stateName']} {ride_data['goingLocation']['zipCode']}"
        } if ride_data.get('goingLocation') else None,
        'travelDate': ride_data['travelDate'],
        'departureStartTime': ride_data['departureStartTime'],
        'departureEndTime': ride_data['departureEndTime'],
        'availableSeats': ride_data['availableSeats'],
        'seatsRemaining': ride_data['seatsRemaining'],
        'suggestedContribution': ride_data['suggestedContribution'],
        'status': ride_data['status'],
        'createdAt': ride_data['createdAt'],
        'updatedAt': ride_data['updatedAt'],
        'driver': {
            'name': ride_data['driver']['name'],
            'phoneNumber': ride_data['driver'].get('phoneNumber', ''),
            'whatsappNumber': ride_data['driver'].get('whatsappNumber', '')
        } if ride_data.get('driver') else None,
        'interestCount': ride_data['interestCount'],
        'isHotRide': ride_data['isHotRide']
    }
    
    return formatted_ride 
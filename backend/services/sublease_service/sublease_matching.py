from datetime import datetime, date
from scripts.database import get_collection
import re

def calculate_date_availability_score(sublease_start, sublease_end, user_start, user_end):
    """Calculate how well the sublease dates match user requirements"""
    # Convert to date objects if they're strings
    if isinstance(sublease_start, str):
        sublease_start = datetime.strptime(sublease_start, '%Y-%m-%d').date()
    if isinstance(sublease_end, str):
        sublease_end = datetime.strptime(sublease_end, '%Y-%m-%d').date()
    if isinstance(user_start, str):
        user_start = datetime.strptime(user_start, '%Y-%m-%d').date()
    if isinstance(user_end, str):
        user_end = datetime.strptime(user_end, '%Y-%m-%d').date()
    
    # Check if sublease completely covers user's needs
    if sublease_start <= user_start and sublease_end >= user_end:
        # Perfect match - sublease covers entire period
        user_duration = (user_end - user_start).days
        sublease_duration = (sublease_end - sublease_start).days
        coverage_ratio = user_duration / sublease_duration
        return min(1.0, coverage_ratio * 1.2)  # Bonus for longer availability
    
    # Check for partial overlap
    overlap_start = max(sublease_start, user_start)
    overlap_end = min(sublease_end, user_end)
    
    if overlap_start < overlap_end:
        overlap_days = (overlap_end - overlap_start).days
        user_duration = (user_end - user_start).days
        overlap_ratio = overlap_days / user_duration
        return overlap_ratio * 0.8  # Penalty for partial coverage
    
    return 0.0

def calculate_time_availability_score(sublease_move_in_time, sublease_move_out_time, user_move_in_time, user_move_out_time):
    """Calculate how well the sublease move-in/out times match user requirements"""
    def time_to_minutes(time_str):
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    
    # Convert times to minutes for comparison
    sublease_in_min = time_to_minutes(sublease_move_in_time)
    sublease_out_min = time_to_minutes(sublease_move_out_time)
    user_in_min = time_to_minutes(user_move_in_time)
    user_out_min = time_to_minutes(user_move_out_time)
    
    # Check if sublease times accommodate user's needs
    if sublease_in_min <= user_in_min and sublease_out_min >= user_out_min:
        # Perfect match - sublease times accommodate user's needs
        user_duration = user_out_min - user_in_min
        sublease_duration = sublease_out_min - sublease_in_min
        coverage_ratio = user_duration / sublease_duration if sublease_duration > 0 else 1.0
        return min(1.0, coverage_ratio * 1.2)  # Bonus for longer availability
    
    # Check for partial overlap
    overlap_start = max(sublease_in_min, user_in_min)
    overlap_end = min(sublease_out_min, user_out_min)
    
    if overlap_start < overlap_end:
        overlap_duration = overlap_end - overlap_start
        user_duration = user_out_min - user_in_min
        overlap_ratio = overlap_duration / user_duration if user_duration > 0 else 0.0
        return overlap_ratio * 0.8  # Penalty for partial coverage
    
    return 0.0

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

def calculate_amenity_match_score(sublease_amenities, user_required_amenities):
    """Calculate amenity matching score"""
    if not user_required_amenities:
        return 1.0  # No requirements = perfect match
    
    if not sublease_amenities:
        return 0.0  # No amenities = no match
    
    # Check if all required amenities are present
    sublease_amenities_set = set(sublease_amenities)
    user_required_set = set(user_required_amenities)
    
    # Calculate how many required amenities are present
    present_amenities = user_required_set.intersection(sublease_amenities_set)
    required_count = len(user_required_set)
    present_count = len(present_amenities)
    
    if required_count == 0:
        return 1.0
    
    # Base score based on required amenities
    base_score = present_count / required_count
    
    # Bonus for extra amenities
    extra_amenities = len(sublease_amenities_set) - len(user_required_set)
    bonus = min(extra_amenities * 0.1, 0.3)  # Max 30% bonus
    
    return min(base_score + bonus, 1.0)

def calculate_sublease_score(sublease, search_criteria):
    """Calculate comprehensive score for sublease matching"""
    score = 0.0
    
    # Date availability (40% weight)
    date_score = calculate_date_availability_score(
        sublease['startDate'],
        sublease['endDate'],
        search_criteria['startDate'],
        search_criteria['endDate']
    )
    score += date_score * 0.4
    
    # Time availability (10% weight) - new field for move-in/out times
    if 'moveInTime' in sublease and 'moveOutTime' in sublease and 'preferredMoveInTime' in search_criteria and 'preferredMoveOutTime' in search_criteria:
        time_score = calculate_time_availability_score(
            sublease['moveInTime'],
            sublease['moveOutTime'],
            search_criteria['preferredMoveInTime'],
            search_criteria['preferredMoveOutTime']
        )
        score += time_score * 0.1
    else:
        # If no time constraints, give full score
        score += 0.1
    
    # Location matching (30% weight) - now exact match since users select from dropdown
    if sublease['location'] == search_criteria['location']:
        location_score = 1.0
    else:
        location_score = 0.0
    score += location_score * 0.3
    
    # Rent affordability (15% weight)
    user_max_rent = search_criteria['maxRent']
    sublease_rent = sublease['rent']
    
    if sublease_rent <= user_max_rent:
        # Bonus for cheaper options
        rent_ratio = sublease_rent / user_max_rent
        rent_score = 1.0 - (rent_ratio * 0.3)  # Up to 30% bonus for cheaper
        score += rent_score * 0.15
    else:
        # Penalty for expensive options
        penalty = min(0.5, (sublease_rent - user_max_rent) / user_max_rent)
        score += (1.0 - penalty) * 0.15
    
    # Amenity matching (5% weight) - reduced from 10% to accommodate location scoring
    amenity_score = calculate_amenity_match_score(
        sublease['amenities'],
        search_criteria.get('requiredAmenities', [])
    )
    score += amenity_score * 0.05
    
    return min(score, 1.0)

def search_subleases_with_scoring(search_criteria):
    """Search for subleases and apply intelligent scoring"""
    sublease_posts = get_collection('sublease_posts')
    
    # Base query - exact location match since users select from dropdown
    base_query = {
        'status': 'active',
        'startDate': {'$lte': search_criteria['endDate']},
        'endDate': {'$gte': search_criteria['startDate']},
        'rent': {'$lte': search_criteria['maxRent']},
        'location': search_criteria['location']  # Exact location match
    }
    
    # Add capacity filters if specified
    if 'minBedrooms' in search_criteria:
        base_query['bedrooms'] = {'$gte': search_criteria['minBedrooms']}
    if 'minBathrooms' in search_criteria:
        base_query['bathrooms'] = {'$gte': search_criteria['minBathrooms']}
    
    potential_subleases = list(sublease_posts.find(base_query))
    scored_subleases = []
    
    for sublease in potential_subleases:
        score = calculate_sublease_score(sublease, search_criteria)
        if score > 0.1:  # Only include subleases with meaningful scores
            sublease['matchScore'] = score
            scored_subleases.append(sublease)
    
    # Sort by match score (highest first)
    scored_subleases.sort(key=lambda x: x['matchScore'], reverse=True)
    
    return scored_subleases

def get_sublease_with_details(sublease_id):
    """Get a sublease with subleaser information using aggregation"""
    sublease_posts = get_collection('sublease_posts')
    
    # Use aggregation to get sublease, subleaser, and location in one query
    pipeline = [
        {'$match': {'_id': sublease_id}},
        {'$lookup': {
            'from': 'users',
            'localField': 'userId',
            'foreignField': '_id',
            'as': 'subleaser'
        }},
        {'$lookup': {
            'from': 'locations',
            'localField': 'location',
            'foreignField': '_id',
            'as': 'locationDetails'
        }},
        {'$unwind': {'path': '$subleaser', 'preserveNullAndEmptyArrays': True}},
        {'$unwind': {'path': '$locationDetails', 'preserveNullAndEmptyArrays': True}}
    ]
    
    sublease_details = list(sublease_posts.aggregate(pipeline))
    
    if not sublease_details:
        return None
    
    sublease_data = sublease_details[0]
    
    # Format the response
    formatted_sublease = {
        '_id': str(sublease_data['_id']),
        'location': {
            '_id': str(sublease_data['locationDetails']['_id']),
            'zipCode': sublease_data['locationDetails']['zipCode'],
            'city': sublease_data['locationDetails']['city'],
            'state': sublease_data['locationDetails']['state'],
            'stateName': sublease_data['locationDetails']['stateName'],
            'displayName': f"{sublease_data['locationDetails']['city']}, {sublease_data['locationDetails']['stateName']} {sublease_data['locationDetails']['zipCode']}"
        } if sublease_data.get('locationDetails') else None,
        'address': sublease_data['address'],
        'monthlyRent': sublease_data['monthlyRent'],
        'startDate': sublease_data['startDate'],
        'endDate': sublease_data['endDate'],
        'moveInTime': sublease_data['moveInTime'],
        'moveOutTime': sublease_data['moveOutTime'],
        'bedrooms': sublease_data['bedrooms'],
        'bathrooms': sublease_data['bathrooms'],
        'propertyType': sublease_data['propertyType'],
        'amenities': sublease_data['amenities'],
        'description': sublease_data['description'],
        'photos': sublease_data['photos'],
        'proximityToCampus': sublease_data['proximityToCampus'],
        'status': sublease_data['status'],
        'createdAt': sublease_data['createdAt'],
        'updatedAt': sublease_data['updatedAt'],
        'subleaser': {
            'name': sublease_data['subleaser']['name'],
            'phoneNumber': sublease_data['subleaser'].get('phoneNumber', ''),
            'whatsappNumber': sublease_data['subleaser'].get('whatsappNumber', '')
        } if sublease_data.get('subleaser') else None
    }
    
    return formatted_sublease 
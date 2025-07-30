from scripts.database import get_collection

def check_deal_breakers(user_request, other_request):
    """Check for fundamental incompatibilities (deal-breakers)"""
    deal_breakers = []
    
    # Room preference compatibility
    if (user_request['roomPreference'] != 'flexible' and 
        other_request['roomPreference'] != 'flexible' and
        user_request['roomPreference'] != other_request['roomPreference']):
        deal_breakers.append('Room preference mismatch')
    
    # Bathroom preference compatibility
    if (user_request['bathroomPreference'] != 'flexible' and 
        other_request['bathroomPreference'] != 'flexible' and
        user_request['bathroomPreference'] != other_request['bathroomPreference']):
        deal_breakers.append('Bathroom preference mismatch')
    
    # Dietary preference compatibility (critical)
    dietary_hierarchy = {
        'pure_vegetarian': 1,
        'vegetarian': 2,
        'eggetarian': 3,
        'okay_non_veg': 4
    }
    
    user_level = dietary_hierarchy.get(user_request['dietaryPreference'], 0)
    other_level = dietary_hierarchy.get(other_request['dietaryPreference'], 0)
    
    if user_level > other_level:  # User is more restrictive
        deal_breakers.append('Dietary preference incompatibility')
    
    # Cultural preferences (if both specified)
    if (user_request.get('religion') and other_request.get('religion') and
        user_request['religion'] != other_request['religion']):
        deal_breakers.append('Religion preference mismatch')
    
    if (user_request.get('caste') and other_request.get('caste') and
        user_request['caste'] != other_request['caste']):
        deal_breakers.append('Caste preference mismatch')
    
    # Pet compatibility
    if user_request['petFriendly'] != other_request['petFriendly']:
        deal_breakers.append('Pet compatibility mismatch')
    
    return deal_breakers

def calculate_compatibility_score(user_request, other_request):
    """Calculate compatibility score for non-deal-breaker matches"""
    score = 0.0
    max_score = 100.0
    
    # Rent budget overlap (25 points)
    user_min, user_max = user_request['rentBudget']['min'], user_request['rentBudget']['max']
    other_min, other_max = other_request['rentBudget']['min'], other_request['rentBudget']['max']
    
    overlap_min = max(user_min, other_min)
    overlap_max = min(user_max, other_max)
    
    if overlap_min <= overlap_max:
        overlap_range = overlap_max - overlap_min
        user_range = user_max - user_min
        other_range = other_max - other_min
        avg_range = (user_range + other_range) / 2
        
        budget_score = (overlap_range / avg_range) * 25 if avg_range > 0 else 0
        score += budget_score
    
    # Lifestyle questionnaire compatibility (75 points)
    user_lifestyle = user_request['lifestyleQuestionnaire']
    other_lifestyle = other_request['lifestyleQuestionnaire']
    
    # Cleanliness level (15 points)
    cleanliness_diff = abs(user_lifestyle['cleanlinessLevel'] - other_lifestyle['cleanlinessLevel'])
    cleanliness_score = max(0, 15 - (cleanliness_diff * 3))  # 3 points per level difference
    score += cleanliness_score
    
    # Sleep schedule (15 points)
    if user_lifestyle['sleepSchedule'] == other_lifestyle['sleepSchedule']:
        score += 15
    elif 'flexible' in [user_lifestyle['sleepSchedule'], other_lifestyle['sleepSchedule']]:
        score += 10
    else:
        score += 5  # Some overlap for different schedules
    
    # Guest frequency (15 points)
    guest_frequency = {
        'rarely': 1,
        'sometimes': 2,
        'often': 3
    }
    user_guest = guest_frequency.get(user_lifestyle['guestFrequency'], 2)
    other_guest = guest_frequency.get(other_lifestyle['guestFrequency'], 2)
    guest_diff = abs(user_guest - other_guest)
    guest_score = max(0, 15 - (guest_diff * 5))  # 5 points per level difference
    score += guest_score
    
    # Study environment (15 points)
    if user_lifestyle['studyEnvironment'] == other_lifestyle['studyEnvironment']:
        score += 15
    elif 'flexible' in [user_lifestyle['studyEnvironment'], other_lifestyle['studyEnvironment']]:
        score += 10
    else:
        score += 5
    
    # Smoking and alcohol compatibility (15 points)
    smoking_match = user_lifestyle['smoking'] == other_lifestyle['smoking']
    alcohol_match = user_lifestyle['alcohol'] == other_lifestyle['alcohol']
    
    if smoking_match and alcohol_match:
        score += 15
    elif smoking_match or alcohol_match:
        score += 10
    else:
        score += 5
    
    return min(score, max_score)

def find_roommate_matches(user_request):
    """Find compatible roommate matches for a user request"""
    roommate_requests = get_collection('roommate_requests')
    
    # Get all other active roommate requests
    other_requests = list(roommate_requests.find({
        'userId': {'$ne': user_request['userId']},
        'status': 'active'
    }))
    
    if not other_requests:
        return [], []
    
    # Process each potential match
    compatible_matches = []
    incompatible_matches = []
    
    for other_request in other_requests:
        # Check for deal-breakers
        deal_breakers = check_deal_breakers(user_request, other_request)
        
        if deal_breakers:
            # Incompatible match
            incompatible_matches.append({
                'request': other_request,
                'dealBreakers': deal_breakers,
                'compatibilityScore': 0
            })
        else:
            # Compatible match - calculate score
            compatibility_score = calculate_compatibility_score(user_request, other_request)
            
            # Get user info for the other request
            users = get_collection('users')
            other_user = users.find_one({'_id': other_request['userId']})
            
            compatible_matches.append({
                'request': other_request,
                'user': {
                    'name': other_user['name'],
                    'phoneNumber': other_user['phoneNumber'],
                    'whatsappNumber': other_user['whatsappNumber']
                },
                'compatibilityScore': round(compatibility_score, 1),
                'dealBreakers': []
            })
    
    # Sort compatible matches by score (highest first)
    compatible_matches.sort(key=lambda x: x['compatibilityScore'], reverse=True)
    
    return compatible_matches, incompatible_matches 
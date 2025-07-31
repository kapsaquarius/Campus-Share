from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id, format_object_id_list
from routes.auth import get_current_user
from services.ride_service import search_rides_with_scoring, get_ride_with_details
from services.notification_service import create_ride_interest_notification, create_ride_update_notification, create_ride_cancellation_notifications

rides_bp = Blueprint('rides', __name__)

@rides_bp.route('/search', methods=['GET', 'POST'])
def search_rides():
    """Smart ride search with intelligent filtering and ranking"""
    try:
        # Handle both GET and POST requests
        if request.method == 'GET':
            # Extract parameters from query string
            travel_date = datetime.strptime(request.args.get('travelDate', '2024-02-15'), '%Y-%m-%d').date()
            starting_from = request.args.get('startingFrom', '')
            going_to = request.args.get('goingTo', '')
            preferred_time_start = request.args.get('preferredTimeStart', '')
            preferred_time_end = request.args.get('preferredTimeEnd', '')
        else:
            # Extract parameters from JSON body
            data = request.get_json()
            travel_date = datetime.strptime(data['travelDate'], '%Y-%m-%d').date()
            starting_from = data['startingFrom']
            going_to = data['goingTo']
            preferred_time_start = data.get('preferredTimeStart', '')
            preferred_time_end = data.get('preferredTimeEnd', '')
        
        # Use the service layer for search
        search_criteria = {
            'travelDate': travel_date,
            'startingFrom': starting_from,
            'goingTo': going_to,
            'preferredStartTime': preferred_time_start,
            'preferredEndTime': preferred_time_end
        }
        
        scored_rides = search_rides_with_scoring(search_criteria)
        
        if not scored_rides:
            return jsonify({
                'rides': [],
                'total': 0,
                'message': 'No rides found for your criteria'
            }), 200
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        paginated_rides = scored_rides[start_idx:end_idx]
        
        # Format rides for response
        formatted_rides = []
        for ride in paginated_rides:
            ride_with_details = get_ride_with_details(ride['_id'])
            if ride_with_details:
                formatted_ride = format_object_id(ride_with_details)
                formatted_rides.append(formatted_ride)
        
        return jsonify({
            'rides': formatted_rides,
            'total': len(scored_rides),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(scored_rides) + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 400

@rides_bp.route('/', methods=['GET', 'POST'])
def rides():
    """Get all rides or create a new ride posting"""
    if request.method == 'GET':
        """Get all rides"""
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        try:
            ride_posts = get_collection('ride_posts')
            rides = list(ride_posts.find({'status': 'active'}).sort('createdAt', -1))
            
            # Format rides for response
            formatted_rides = []
            for ride in rides:
                formatted_ride = format_object_id(ride)
                formatted_rides.append(formatted_ride)
            
            return jsonify({
                'rides': formatted_rides,
                'total': len(formatted_rides)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to get rides: {str(e)}'}), 500
    
    elif request.method == 'POST':
        """Create a new ride posting"""
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            
            # Frontend handles all validations, proceed directly
            ride_data = {
                'userId': ObjectId(user['_id']),
                'startingFrom': data['startingFrom'],
                'goingTo': data['goingTo'],
                'travelDate': datetime.strptime(data['travelDate'], '%Y-%m-%d').strftime('%Y-%m-%d'),
                'departureStartTime': data['departureStartTime'],
                'departureEndTime': data['departureEndTime'],
                'availableSeats': data['availableSeats'],
                'seatsRemaining': data['availableSeats'],
                'suggestedContribution': data.get('suggestedContribution', 0),
                'status': 'active',
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            ride_posts = get_collection('ride_posts')
            result = ride_posts.insert_one(ride_data)
            
            # Get the created ride with proper formatting
            created_ride = ride_posts.find_one({'_id': result.inserted_id})
            
            return jsonify({
                'message': 'Ride posted successfully',
                'ride': format_object_id(created_ride)
            }), 201
            
        except Exception as e:
            return jsonify({'error': f'Failed to create ride: {str(e)}'}), 400

@rides_bp.route('/<ride_id>/interest', methods=['POST'])
def express_interest():
    """Express interest in a ride with notification"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ride_id = ObjectId(request.view_args['ride_id'])
        
        # Get ride and provider info in one query using aggregation
        ride_posts = get_collection('ride_posts')
        
        # Use aggregation to get ride and provider info in one query
        pipeline = [
            {'$match': {'_id': ride_id, 'status': 'active'}},
            {'$lookup': {
                'from': 'users',
                'localField': 'userId',
                'foreignField': '_id',
                'as': 'provider'
            }},
            {'$unwind': '$provider'}
        ]
        
        ride_with_provider = list(ride_posts.aggregate(pipeline))
        
        if not ride_with_provider:
            return jsonify({'error': 'Ride not found'}), 404
        
        ride_data = ride_with_provider[0]
        provider_data = ride_data['provider']
        
        # Check if already interested - this is the only necessary check
        ride_interests = get_collection('ride_interests')
        existing_interest = ride_interests.find_one({
            'rideId': ride_id,
            'interestedUserId': ObjectId(user['_id'])
        })
        
        if existing_interest:
            return jsonify({'error': 'Already expressed interest'}), 400
        
        # Create interest record
        interest_data = {
            'rideId': ride_id,
            'interestedUserId': ObjectId(user['_id']),
            'status': 'interested',
            'createdAt': datetime.utcnow()
        }
        ride_interests.insert_one(interest_data)
        
        # Send notification to ride provider
        create_ride_interest_notification(ride_id, user['_id'], ride_data)
        
        # Return contact information for direct communication
        return jsonify({
            'message': 'Interest expressed successfully',
            'rideProvider': {
                'name': provider_data['name'],
                'phoneNumber': provider_data.get('phoneNumber', ''),
                'whatsappNumber': provider_data.get('whatsappNumber', '')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to express interest: {str(e)}'}), 400

@rides_bp.route('/my-rides', methods=['GET'])
def get_my_rides():
    """Get current user's ride postings"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ride_posts = get_collection('ride_posts')
        
        # Get query parameters for filtering
        status_filter = request.args.get('status', 'all')
        
        # Build query - get ALL rides for the user, not just active ones
        query = {'userId': ObjectId(user['_id'])}
        if status_filter != 'all':
            query['status'] = status_filter
        
        rides = list(ride_posts.find(query).sort('createdAt', -1))
        
        formatted_rides = []
        for ride in rides:
            # Get interest count
            ride_interests = get_collection('ride_interests')
            interest_count = ride_interests.count_documents({'rideId': ride['_id']})
            
            formatted_ride = format_object_id(ride)
            formatted_ride['interestCount'] = interest_count
            formatted_rides.append(formatted_ride)
        
        return jsonify({'rides': formatted_rides}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get rides: {str(e)}'}), 400

@rides_bp.route('/<ride_id>', methods=['PUT'])
def update_ride():
    """Update ride posting with notification to interested users"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ride_id = ObjectId(request.view_args['ride_id'])
        data = request.get_json()
        
        # Update ride directly - frontend already validated ownership
        ride_posts = get_collection('ride_posts')
        
        # Update ride
        update_data = {
            'updatedAt': datetime.utcnow()
        }
        
        if 'startingFrom' in data:
            update_data['startingFrom'] = data['startingFrom']
        if 'goingTo' in data:
            update_data['goingTo'] = data['goingTo']
        if 'travelDate' in data:
            update_data['travelDate'] = datetime.strptime(data['travelDate'], '%Y-%m-%d').date()
        if 'departureStartTime' in data:
            update_data['departureStartTime'] = data['departureStartTime']
        if 'departureEndTime' in data:
            update_data['departureEndTime'] = data['departureEndTime']
        if 'seatsRemaining' in data:
            update_data['seatsRemaining'] = data['seatsRemaining']
        if 'suggestedContribution' in data:
            update_data['suggestedContribution'] = data['suggestedContribution']
        
        result = ride_posts.update_one(
            {'_id': ride_id, 'userId': ObjectId(user['_id'])}, 
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Ride not found or not owned by user'}), 404
        
        # Get the updated ride for notification
        updated_ride = ride_posts.find_one({'_id': ride_id})
        
        # Notify interested users
        create_ride_update_notification(ride_id, updated_ride)
        
        return jsonify({'message': 'Ride updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update ride: {str(e)}'}), 400

@rides_bp.route('/<ride_id>', methods=['DELETE'])
def delete_ride():
    """Delete ride posting with notification to interested users"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        ride_id = ObjectId(request.view_args['ride_id'])
        
        # Get ride info for notification before deletion
        ride_posts = get_collection('ride_posts')
        ride = ride_posts.find_one({'_id': ride_id, 'userId': ObjectId(user['_id'])})
        
        if not ride:
            return jsonify({'error': 'Ride not found or not owned by user'}), 404
        
        # Notify interested users before deleting
        create_ride_cancellation_notifications(ride_id, ride)
        
        # Delete ride and related interests in one operation
        ride_posts.delete_one({'_id': ride_id})
        ride_interests = get_collection('ride_interests')
        ride_interests.delete_many({'rideId': ride_id})
        
        return jsonify({'message': 'Ride deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete ride: {str(e)}'}), 400 
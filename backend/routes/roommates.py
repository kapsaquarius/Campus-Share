from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id, format_object_id_list
from routes.auth import get_current_user
from services.roommate_service import find_roommate_matches, calculate_compatibility_score

roommates_bp = Blueprint('roommates', __name__)

@roommates_bp.route('/search', methods=['POST'])
def search_roommates():
    """Smart roommate search with deal-breaker filtering and compatibility scoring"""
    try:
        data = request.get_json()
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Get user's roommate request
        roommate_requests = get_collection('roommate_requests')
        user_request = roommate_requests.find_one({
            'userId': ObjectId(user['_id']),
            'status': 'active'
        })
        
        if not user_request:
            return jsonify({'error': 'Please create a roommate request first'}), 400
        
        # Use the service layer for matching
        compatible_matches, incompatible_matches = find_roommate_matches(user_request)
        
        if not compatible_matches and not incompatible_matches:
            return jsonify({
                'matches': [],
                'total': 0,
                'message': 'No roommate requests found'
            }), 200
        
        # Format compatible matches for response
        formatted_matches = []
        for match in compatible_matches:
            formatted_match = {
                'request': format_object_id(match['request']),
                'user': match['user'],
                'compatibilityScore': match['compatibilityScore'],
                'dealBreakers': match['dealBreakers']
            }
            formatted_matches.append(formatted_match)
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        paginated_matches = formatted_matches[start_idx:end_idx]
        
        return jsonify({
            'matches': paginated_matches,
            'total': len(formatted_matches),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(formatted_matches) + per_page - 1) // per_page,
            'incompatible_count': len(incompatible_matches)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 400

@roommates_bp.route('/', methods=['GET', 'POST'])
def roommates():
    """Get all roommate requests or create a new one"""
    if request.method == 'GET':
        """Get all roommate requests"""
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        try:
            roommate_requests = get_collection('roommate_requests')
            requests = list(roommate_requests.find({'status': 'active'}).sort('createdAt', -1))
            
            # Format requests for response
            formatted_requests = []
            for req in requests:
                formatted_request = format_object_id(req)
                formatted_requests.append(formatted_request)
            
            return jsonify({
                'requests': formatted_requests,
                'total': len(formatted_requests)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to get roommate requests: {str(e)}'}), 500
    
    elif request.method == 'POST':
        """Create a new roommate request"""
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            
            # Frontend already validated required fields, proceed directly
            # Check if user already has an active request
            roommate_requests = get_collection('roommate_requests')
            existing_request = roommate_requests.find_one({
                'userId': ObjectId(user['_id']),
                'status': 'active'
            })
            
            if existing_request:
                return jsonify({'error': 'You already have an active roommate request'}), 400
            
            # Create roommate request
            request_data = {
                'userId': ObjectId(user['_id']),
                'roomPreference': data['roomPreference'],
                'bathroomPreference': data['bathroomPreference'],
                'dietaryPreference': data['dietaryPreference'],
                'culturalPreference': data.get('culturalPreference', ''),
                'petFriendly': data['petFriendly'],
                'rentBudget': data['rentBudget'],
                'aboutMe': data['aboutMe'],
                'lifestyleQuestionnaire': data['lifestyleQuestionnaire'],
                'status': 'active',
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            result = roommate_requests.insert_one(request_data)
            
            return jsonify({
                'message': 'Roommate request created successfully',
                'requestId': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': f'Failed to create roommate request: {str(e)}'}), 400

@roommates_bp.route('/my-request', methods=['GET'])
def get_my_roommate_request():
    """Get current user's roommate request"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        roommate_requests = get_collection('roommate_requests')
        request_data = roommate_requests.find_one({
            'userId': ObjectId(user['_id']),
            'status': 'active'
        })
        
        if not request_data:
            return jsonify({'error': 'No active roommate request found'}), 404
        
        return jsonify({'request': format_object_id(request_data)}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get roommate request: {str(e)}'}), 400

@roommates_bp.route('/my-request', methods=['PUT'])
def update_roommate_request():
    """Update current user's roommate request"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        roommate_requests = get_collection('roommate_requests')
        
        # Check if user has an active request
        existing_request = roommate_requests.find_one({
            'userId': ObjectId(user['_id']),
            'status': 'active'
        })
        
        if not existing_request:
            return jsonify({'error': 'No active roommate request found'}), 404
        
        # Update request
        update_data = {
            'updatedAt': datetime.utcnow()
        }
        
        # Add fields that are being updated
        fields_to_update = [
            'roomPreference', 'bathroomPreference', 'dietaryPreference',
            'religion', 'caste', 'petFriendly', 'rentBudget', 'aboutMe',
            'lifestyleQuestionnaire'
        ]
        
        for field in fields_to_update:
            if field in data:
                update_data[field] = data[field]
        
        roommate_requests.update_one(
            {'_id': existing_request['_id']},
            {'$set': update_data}
        )
        
        return jsonify({'message': 'Roommate request updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update roommate request: {str(e)}'}), 400

@roommates_bp.route('/my-request', methods=['DELETE'])
def delete_roommate_request():
    """Delete current user's roommate request"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        roommate_requests = get_collection('roommate_requests')
        
        # Check if user has an active request
        existing_request = roommate_requests.find_one({
            'userId': ObjectId(user['_id']),
            'status': 'active'
        })
        
        if not existing_request:
            return jsonify({'error': 'No active roommate request found'}), 404
        
        # Mark as cancelled instead of deleting
        roommate_requests.update_one(
            {'_id': existing_request['_id']},
            {'$set': {'status': 'cancelled', 'updatedAt': datetime.utcnow()}}
        )
        
        return jsonify({'message': 'Roommate request cancelled successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel roommate request: {str(e)}'}), 400

@roommates_bp.route('/my-requests', methods=['GET'])
def get_my_roommate_requests():
    """Get all roommate requests for current user (active and inactive)"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        roommate_requests = get_collection('roommate_requests')
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status_filter = request.args.get('status', 'all')  # all, active, cancelled
        
        # Build query
        query = {'userId': ObjectId(user['_id'])}
        if status_filter != 'all':
            query['status'] = status_filter
        
        total_count = roommate_requests.count_documents(query)
        
        # Get paginated requests
        skip = (page - 1) * per_page
        requests = list(
            roommate_requests.find(query)
            .sort('createdAt', -1)
            .skip(skip)
            .limit(per_page)
        )
        
        formatted_requests = [format_object_id(req) for req in requests]
        
        return jsonify({
            'requests': formatted_requests,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get roommate requests: {str(e)}'}), 400 